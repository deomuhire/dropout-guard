from .. import db
from datetime import datetime, date

class Student(db.Model):
    __tablename__ = 'students'

    id         = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), unique=True, nullable=False)  # e.g. s_0014
    name       = db.Column(db.String(150), nullable=False)
    guardian   = db.Column(db.String(150))
    village    = db.Column(db.String(80))
    gender     = db.Column(db.String(10))

    school_id  = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    class_id   = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active  = db.Column(db.Boolean, default=True)

    # Relationships
    school      = db.relationship('School', back_populates='students')
    class_      = db.relationship('Class',  back_populates='students', foreign_keys=[class_id])
    attendances = db.relationship('Attendance', back_populates='student', lazy='dynamic')

    def to_dict(self):
        today_record = self.attendances.filter_by(date=date.today()).first()
        # Use attendance gender as fallback if student gender is not set
        effective_gender = self.gender if self.gender in ('Male', 'Female') else (today_record.gender if today_record and today_record.gender in ('Male', 'Female') else self.gender)
        return {
            'id':         self.id,
            'student_id': self.student_id,
            'name':       self.name,
            'guardian':   self.guardian,
            'village':    self.village,
            'gender':     effective_gender,
            'school_id':  self.school_id,
            'class_id':   self.class_id,
            'school':     self.school.to_dict_basic() if self.school else None,
            'class_name': self.class_.name if self.class_ else None,
            'at_risk':    today_record.at_risk if today_record else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
