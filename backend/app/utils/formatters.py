from datetime import datetime, date
from typing import Optional

def format_date(d: Optional[date]) -> Optional[str]:
    """Format date to YYYY-MM-DD"""
    if d:
        return d.isoformat()
    return None

def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime to ISO format"""
    if dt:
        return dt.isoformat()
    return None

def format_currency(amount: float) -> str:
    """Format currency"""
    return f"${amount:,.2f}"

def format_percentage(value: float) -> str:
    """Format percentage"""
    return f"{value:.1f}%"

def format_score(score: float) -> str:
    """Format work score"""
    return f"{score:.1f}/5.0"