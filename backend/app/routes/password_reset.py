from flask import Blueprint, request, jsonify
from datetime import datetime

from .. import db
from ..models.user import User
from ..models.password_reset_token import PasswordResetToken
from ..utils.auth import validate_password


reset_bp = Blueprint('password_reset', __name__)


@reset_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()
    new_password = data.get('new_password') or ''

    if not token or not new_password:
        return jsonify({'error': 'Token and new_password are required'}), 400

    is_valid, criteria = validate_password(new_password)
    if not is_valid:
        return jsonify({'error': 'Password does not meet strength requirements', 'criteria': criteria}), 400

    prt = PasswordResetToken.query.filter_by(token=token).first()
    if not prt:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    if prt.used_at is not None:
        return jsonify({'error': 'This reset token has already been used'}), 400

    if datetime.utcnow() >= prt.expires_at:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    user = User.query.get(prt.user_id)
    if not user:
        return jsonify({'error': 'Invalid reset token'}), 400

    user.set_password(new_password)
    user.must_change_password = False

    prt.mark_used()
    db.session.commit()

    return jsonify({'message': 'Password reset successfully'}), 200

