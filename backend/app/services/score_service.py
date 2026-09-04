from typing import Dict, List, Optional
from datetime import date
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class ScoreService:
    def __init__(self):
        self.efficiency_weight = settings.EFFICIENCY_WEIGHT
        self.completion_weight = settings.COMPLETION_WEIGHT
        self.timeliness_weight = settings.TIMELINESS_WEIGHT
        self.quality_weight = settings.QUALITY_WEIGHT
        self.thresholds = settings.SCORE_THRESHOLDS

    def calculate_score(
        self,
        efficiency: float,
        completion_rate: float,
        timeliness_score: float,
        quality_score: float,
        efficiency_weight: Optional[int] = None,
        completion_weight: Optional[int] = None,
        timeliness_weight: Optional[int] = None,
        quality_weight: Optional[int] = None
    ) -> Dict:
        """Calculate work score with configurable weights"""
        
        # Use provided weights or defaults. `is not None` (not plain `or`)
        # so an explicitly-passed weight of 0 - a legitimate choice, e.g.
        # "don't count quality at all" - is respected instead of silently
        # falling back to the default weight.
        eff_weight = efficiency_weight if efficiency_weight is not None else self.efficiency_weight
        comp_weight = completion_weight if completion_weight is not None else self.completion_weight
        time_weight = timeliness_weight if timeliness_weight is not None else self.timeliness_weight
        qual_weight = quality_weight if quality_weight is not None else self.quality_weight
        
        # Ensure weights sum to 100
        total_weight = eff_weight + comp_weight + time_weight + qual_weight
        if total_weight == 0:
            # All four weights explicitly zeroed out - nothing to
            # normalize against, so just leave every score's contribution
            # at zero rather than dividing by zero.
            eff_weight = comp_weight = time_weight = qual_weight = 0
        elif total_weight != 100:
            # Normalize weights
            eff_weight = (eff_weight / total_weight) * 100
            comp_weight = (comp_weight / total_weight) * 100
            time_weight = (time_weight / total_weight) * 100
            qual_weight = (qual_weight / total_weight) * 100
        
        # Calculate weighted score (0-100 scale, since inputs and weights are 0-100)
        raw_score = (
            (efficiency * eff_weight / 100) +
            (completion_rate * comp_weight / 100) +
            (timeliness_score * time_weight / 100) +
            (quality_score * qual_weight / 100)
        )

        # Convert to the 0-5 scale used for score_category thresholds and
        # final_work_score in the DB (100 / 20 = 5)
        score = raw_score / 20
        
        # Cap at 5.0
        final_score = min(score, 5.0)
        final_score = round(final_score, 2)
        
        # Determine category
        category = self._get_score_category(final_score)
        
        return {
            'score': final_score,
            'score_category': category,
            'breakdown': {
                'efficiency': {
                    'value': efficiency,
                    'weight': eff_weight,
                    'contribution': efficiency * eff_weight / 100
                },
                'completion_rate': {
                    'value': completion_rate,
                    'weight': comp_weight,
                    'contribution': completion_rate * comp_weight / 100
                },
                'timeliness': {
                    'value': timeliness_score,
                    'weight': time_weight,
                    'contribution': timeliness_score * time_weight / 100
                },
                'quality': {
                    'value': quality_score,
                    'weight': qual_weight,
                    'contribution': quality_score * qual_weight / 100
                }
            },
            'weights_used': {
                'efficiency': eff_weight,
                'completion_rate': comp_weight,
                'timeliness': time_weight,
                'quality': qual_weight
            }
        }

    def _get_score_category(self, score: float) -> str:
        """Get performance category based on score"""
        if score >= self.thresholds['excellent']:
            return 'Excellent'
        elif score >= self.thresholds['good']:
            return 'Good'
        elif score >= self.thresholds['average']:
            return 'Average'
        elif score >= self.thresholds['below_average']:
            return 'Below Average'
        else:
            return 'Needs Improvement'

    def calculate_efficiency_score(self, allocated_hours: float, actual_hours: float) -> float:
        """Calculate efficiency score (0-100)"""
        if actual_hours <= 0 or allocated_hours <= 0:
            return 0
        efficiency = (allocated_hours / actual_hours) * 100
        return min(efficiency, 100)

    def calculate_timeliness_score(self, due_date: Optional[date], completed_date: Optional[date]) -> float:
        """Calculate timeliness score (0-100)"""
        if not due_date or not completed_date:
            return 50  # Default score if no dates
            
        if completed_date <= due_date:
            return 100
        
        # Calculate days overdue
        days_overdue = (completed_date - due_date).days
        
        # Penalize: 10 points per day overdue, max penalty 100
        penalty = min(days_overdue * 10, 100)
        return max(0, 100 - penalty)

    def calculate_completion_rate(self, total_tasks: int, completed_tasks: int) -> float:
        """Calculate completion rate (0-100)"""
        if total_tasks <= 0:
            return 0
        return (completed_tasks / total_tasks) * 100

    def get_quality_score(self, quality_rating: float) -> float:
        """Convert quality rating to score (0-100)"""
        # Assuming quality_rating is 0-5
        return (quality_rating / 5) * 100
