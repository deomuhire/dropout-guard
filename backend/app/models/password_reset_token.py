from datetime import datetime, timedelta
from .. import db


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('password_reset_tokens', lazy='dynamic'))

    token = db.Column(db.String(128), unique=True, nullable=False, index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    used_at = db.Column(db.DateTime, nullable=True)

    def is_expired(self):
        return datetime.utcnow() >= self.expires_at

    def mark_used(self):
        self.used_at = datetime.utcnow()

    @classmethod
    def create_for_user(cls, user_id, token, expires_minutes=30):
        return cls(
            user_id=user_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes)
        )

