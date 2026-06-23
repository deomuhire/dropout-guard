from .. import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    # One of: superadmin | sector_leader | headmaster | dos | teacher
    role          = db.Column(db.String(20), nullable=False)

    first_name    = db.Column(db.String(80))
    last_name     = db.Column(db.String(80))
    phone         = db.Column(db.String(10))
    must_change_password = db.Column(db.Boolean, default=True)

    # Location fields (used mainly for sector_leader and headmaster)
    province      = db.Column(db.String(80))
    district      = db.Column(db.String(80))
    sector        = db.Column(db.String(80))
    village       = db.Column(db.String(80))

    # Link teacher/DOS/headmaster to a school
    school_id     = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=True)

    # Track who created this user (for edit/delete permissions)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    is_active     = db.Column(db.Boolean, default=True)

    # Relationships
    school        = db.relationship('School', back_populates='users', foreign_keys=[school_id])
    created_by    = db.relationship('User', remote_side=[id], foreign_keys=[created_by_id])
    attendances   = db.relationship('Attendance', back_populates='recorded_by', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        assigned_class = None
        if self.role == 'teacher':
            from .school import Class
            cls = Class.query.filter_by(teacher_id=self.id).first()
            assigned_class = cls.to_dict_basic() if cls else None

        return {
            'id':           self.id,
            'username':     self.username,
            'email':        self.email,
            'role':         self.role,
            'first_name':   self.first_name,
            'last_name':    self.last_name,
            'phone':        self.phone,
            'must_change_password': self.must_change_password,
            'province':     self.province,
            'district':     self.district,
            'sector':       self.sector,
            'village':      self.village,
            'school_id':    self.school_id,
            'school':       self.school.to_dict_basic() if self.school else None,
            'assigned_class': assigned_class,
            'created_by_id':self.created_by_id,
            'is_active':    self.is_active,
            'created_at':   self.created_at.isoformat() if self.created_at else None
        }
