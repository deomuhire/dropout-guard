from .. import db
from datetime import datetime

class School(db.Model):
    __tablename__ = 'schools'

    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(150), nullable=False)

    # Location
    province     = db.Column(db.String(80), nullable=False)
    district     = db.Column(db.String(80), nullable=False)
    sector       = db.Column(db.String(80), nullable=False)
    village      = db.Column(db.String(80))

    # Headmaster details
    headmaster_name  = db.Column(db.String(150))
    headmaster_email = db.Column(db.String(120))

    # Who (sector_leader) registered this school
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    is_active     = db.Column(db.Boolean, default=True)

    # Relationships
    users    = db.relationship('User',    back_populates='school', foreign_keys='User.school_id', lazy='dynamic')
    students = db.relationship('Student', back_populates='school', lazy='dynamic')
    classes  = db.relationship('Class',   back_populates='school', lazy='dynamic')

    def to_dict_basic(self):
        return {
            'id':       self.id,
            'name':     self.name,
            'province': self.province,
            'district': self.district,
            'sector':   self.sector,
            'village':  self.village
        }

    def to_dict(self):
        return {
            'id':               self.id,
            'name':             self.name,
            'province':         self.province,
            'district':         self.district,
            'sector':           self.sector,
            'village':          self.village,
            'headmaster_name':  self.headmaster_name,
            'headmaster_email': self.headmaster_email,
            'created_by_id':    self.created_by_id,
            'is_active':        self.is_active,
            'created_at':       self.created_at.isoformat() if self.created_at else None
        }


class Class(db.Model):
    __tablename__ = 'classes'

    id        = db.Column(db.Integer, primary_key=True)
    name      = db.Column(db.String(80), nullable=False)   # e.g. "S3 A", "P6 B"
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)

    # Teacher assigned to this class
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Relationships
    school   = db.relationship('School', back_populates='classes')
    teacher  = db.relationship('User',   foreign_keys=[teacher_id])
    students = db.relationship('Student', back_populates='class_', lazy='dynamic')

    def to_dict_basic(self):
        return {
            'id':            self.id,
            'name':          self.name,
            'school_id':     self.school_id,
            'teacher_id':    self.teacher_id,
            'student_count': self.students.filter_by(is_active=True).count()
        }

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'school_id':  self.school_id,
            'teacher_id': self.teacher_id,
            'teacher':    self.teacher.to_dict() if self.teacher else None,
            'student_count': self.students.filter_by(is_active=True).count()
        }
