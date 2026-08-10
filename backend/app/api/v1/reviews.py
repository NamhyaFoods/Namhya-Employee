from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date, datetime
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewListResponse, KPIResponse
from app.services.review_service import ReviewService
from app.services.performance_service import PerformanceService
from app.db.supabase import get_supabase_admin
from app.dependencies import get_current_user, get_current_admin
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Every endpoint below uses the service-role client, not the plain anon
# client the file previously used everywhere. Each route is already gated
# by get_current_user/get_current_admin, but the anon client never carries
# the requesting user's own session into Postgrest calls, so auth.uid() is
# NULL there and RLS silently blocks reads/writes regardless of who is
# actually asking - the same issue fixed earlier in users.py, tasks.py and
# performance.py, just never applied to this router. This is why "Generate
# Reviews" appeared to do nothing (the insert was blocked and generated: 0
# came back) and the review detail page always said "not found".

@router.post("/generate/{user_id}", response_model=ReviewResponse)
async def generate_review(
    user_id: str,
    review_month: Optional[date] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Generate a monthly review for a user (admin only)"""
    try:
        supabase = get_supabase_admin()
        review_service = ReviewService(supabase)
        review = await review_service.generate_monthly_review(user_id, review_month)
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not generate review. User may have no tasks this month."
            )
        
        return ReviewResponse(**review)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating review: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/generate-all")
async def generate_all_reviews(
    review_month: Optional[date] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Generate monthly reviews for all employees (admin only)"""
    try:
        supabase = get_supabase_admin()
        review_service = ReviewService(supabase)
        result = await review_service.generate_all_monthly_reviews(review_month)
        
        return result
    except Exception as e:
        logger.error(f"Error generating all reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[ReviewResponse])
async def get_all_reviews(
    limit: int = Query(100, description="Number of reviews to return"),
    current_user: dict = Depends(get_current_admin)
):
    """Get reviews across all employees (admin only)"""
    try:
        supabase = get_supabase_admin()
        review_service = ReviewService(supabase)
        reviews = await review_service.get_all_reviews(limit)

        return [ReviewResponse(**review) for review in reviews]
    except Exception as e:
        logger.error(f"Error getting all reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-reviews", response_model=List[ReviewResponse])
async def get_my_reviews(
    limit: int = Query(6, description="Number of reviews to return"),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's review history"""
    try:
        supabase = get_supabase_admin()
        review_service = ReviewService(supabase)
        reviews = await review_service.get_user_reviews(current_user['id'], limit)
        
        return [ReviewResponse(**review) for review in reviews]
    except Exception as e:
        logger.error(f"Error getting my reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(
    user_id: str,
    limit: int = Query(12, description="Number of reviews to return"),
    current_user: dict = Depends(get_current_admin)
):
    """Get review history for a user (admin only)"""
    try:
        supabase = get_supabase_admin()
        review_service = ReviewService(supabase)
        reviews = await review_service.get_user_reviews(user_id, limit)
        
        return [ReviewResponse(**review) for review in reviews]
    except Exception as e:
        logger.error(f"Error getting user reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/pending")
async def get_pending_reviews(
    current_user: dict = Depends(get_current_admin)
):
    """Get employees with pending reviews (admin only)"""
    try:
        supabase = get_supabase_admin()
        review_service = ReviewService(supabase)
        pending = await review_service.get_pending_reviews()
        
        return pending
    except Exception as e:
        logger.error(f"Error getting pending reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/kpi/{user_id}")
async def get_kpi_scores(
    user_id: str,
    review_id: Optional[str] = Query(None, description="Filter by review ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get KPI scores for a user"""
    try:
        # Check access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        supabase = get_supabase_admin()
        query = supabase.table('kpi_scores')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)
        
        if review_id:
            query = query.eq('review_id', review_id)
        
        result = query.execute()
        
        return result.data if result.data else []
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting KPI scores: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/kpi")
async def create_kpi_score(
    kpi_data: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Create KPI score (admin only)"""
    try:
        supabase = get_supabase_admin()
        kpi_data['created_at'] = datetime.utcnow().isoformat()
        kpi_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('kpi_scores')\
            .insert(kpi_data)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create KPI score"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating KPI score: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get review by ID"""
    try:
        supabase = get_supabase_admin()
        result = supabase.table('performance_reviews')\
            .select('*')\
            .eq('id', review_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        review = result.data[0]
        
        # Check access
        if current_user['id'] != review['user_id'] and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return ReviewResponse(**review)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting review: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str,
    review_data: ReviewUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update review (admin only)"""
    try:
        supabase = get_supabase_admin()
        review_service = ReviewService(supabase)
        review = await review_service.update_review(
            review_id,
            review_data.dict(exclude_unset=True),
            current_user['id']
        )
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return ReviewResponse(**review)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating review: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )