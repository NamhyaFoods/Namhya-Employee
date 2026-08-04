import re
from typing import Optional

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Remove common separators
    phone = re.sub(r'[\s\-()]', '', phone)
    pattern = r'^\+?[0-9]{10,15}$'
    return bool(re.match(pattern, phone))

def validate_password(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 6:
        return False
    # At least one number
    if not re.search(r'\d', password):
        return False
    # At least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False
    return True