from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .. import db
from ..models.user import User
from ..models.password_reset_token import PasswordResetToken
from ..utils.auth import validate_password
from ..utils.email import send_password_reset_email

import secrets
import os
import urllib.parse

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    # Allow login by username OR email for user convenience
    user = User.query.filter((User.username == username) | (User.email == username), User.is_active == True).first()
    if not user:
        print(f"Failed login attempt for '{username}': user not found or inactive")
        return jsonify({'error': 'Invalid username or password'}), 401

    # Defensive: if password hash is missing/invalid in DB, avoid 500s
    try:
        password_ok = bool(user.password_hash) and user.check_password(password)
    except Exception as e:
        print(f"Failed login attempt for '{username}': password hash error: {e}")
        password_ok = False

    if not password_ok:
        # Log failed attempt for debugging (do not reveal to client)
        print(f"Failed login attempt for '{username}': invalid password")
        return jsonify({'error': 'Invalid username or password'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json() or {}
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    if not user.check_password(data.get('current_password', '')):
        return jsonify({'error': 'Current password is wrong'}), 400
    new_password = data.get('new_password', '')
    is_valid, criteria = validate_password(new_password)
    if not is_valid:
        return jsonify({'error': 'Password does not meet strength requirements', 'criteria': criteria}), 400
    user.set_password(data['new_password'])
    user.must_change_password = False
    db.session.commit()
    return jsonify({'message': 'Password changed successfully', 'user': user.to_dict()}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()

    # Avoid revealing account existence.
    if user:
        token = secrets.token_urlsafe(48)

        # Expire after 30 minutes (configurable later if needed)
        prt = PasswordResetToken.create_for_user(user.id, token, expires_minutes=30)
        db.session.add(prt)
        db.session.commit()

        # Frontend base URL for reset page link
        frontend_base = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173')
        reset_link = f"{frontend_base}/reset-password?token={urllib.parse.quote(token)}"

        try:
            send_password_reset_email({
                'smtp_host': os.getenv('SMTP_HOST'),
                'smtp_port': int(os.getenv('SMTP_PORT', '587')),
                'smtp_user': os.getenv('SMTP_USER'),
                'smtp_password': os.getenv('SMTP_PASSWORD'),
                'email_from': os.getenv('EMAIL_FROM'),
                'to_email': user.email,
                'reset_link': reset_link,
                'username': user.username,
            })
        except Exception as e:
            # Log but still return generic message
            print(f"❌ Failed to send password reset email: {e}")
            print(f"Reset token (dev): {token}")

    return jsonify({
        'message': 'If an account with this email exists, a password reset link will be sent to your email address.'
    }), 200

