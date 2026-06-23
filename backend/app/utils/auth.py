import re
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models.user import User

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))

def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = get_current_user()
            if not user or user.role not in roles:
                return jsonify({'error': 'Access denied'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def validate_password(password):
    """
    Validate that a password meets strong password criteria.
    Returns a tuple: (is_valid, dict_of_criteria_checks)
    """
    criteria = {
        'length': len(password) >= 8,
        'uppercase': bool(re.search(r'[A-Z]', password)),
        'lowercase': bool(re.search(r'[a-z]', password)),
        'number': bool(re.search(r'[0-9]', password)),
        'special': bool(re.search(r'[^A-Za-z0-9]', password)),
    }
    is_valid = all(criteria.values())
    return is_valid, criteria