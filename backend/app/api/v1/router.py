from fastapi import APIRouter
from app.api.v1 import auth, users, tasks, time_logs, performance, reviews

router = APIRouter()

# Include all route modules
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
router.include_router(time_logs.router, prefix="/time-logs", tags=["Time Logs"])
router.include_router(performance.router, prefix="/performance", tags=["Performance"])
router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])