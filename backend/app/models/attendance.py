from .. import db
from datetime import datetime, date


class Attendance(db.Model):
    __tablename__ = 'attendance'
    __table_args__ = (
        db.UniqueConstraint('student_id', 'date', name='uq_attendance_student_date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)

    # ── The 15 model input parameters ──────────────────────────────────────
    # Categorical (stored as the string label)
    age_group = db.Column(db.String(10))  # '13-Jun','14 - 16','17 - 19','20 - 21'
    gender = db.Column(db.String(10))  # 'Male','Female'
    performance = db.Column(db.String(10))  # '0-40','41-50','51-60','61-70','71-100'
    year_of_study = db.Column(db.String(20))  # 'Primary','Lower Secondary','Upper Secondary'
    social_activity = db.Column(db.String(20))  # 'None','Dance','Sport','Other'
    today_attended = db.Column(db.Boolean(), nullable=True)

    # Binary Yes/No factors (stored as 1 or 0)
    lack_of_school_material = db.Column(db.Integer, default=0)
    lack_of_school_fees = db.Column(db.Integer, default=0)
    job_opportunity = db.Column(db.Integer, default=0)
    pregnancy = db.Column(db.Integer, default=0)
    family_conflicts = db.Column(db.Integer, default=0)
    drug_abuse = db.Column(db.Integer, default=0)
    lack_of_motivation = db.Column(db.Integer, default=0)
    illness = db.Column(db.Integer, default=0)
    absenteeism = db.Column(db.Integer, default=0)
    bad_discipline = db.Column(db.Integer, default=0)

    # ── ML Prediction result ────────────────────────────────────────────────
    at_risk = db.Column(db.Boolean(), nullable=True)
    risk_probability = db.Column(db.Float, default=0.0)  # e.g. 73.4

    # ── Meta ─────────────────────────────────────────────────────────────────
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = db.relationship('Student', back_populates='attendances')
    recorded_by = db.relationship('User', back_populates='attendances')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'date': self.date.isoformat() if self.date else None,

            'gender': self.gender,
            'performance': self.performance,
            'year_of_study': self.year_of_study,
            'social_activity': self.social_activity,
            'today_attended': self.today_attended,

            'lack_of_school_material': self.lack_of_school_material,
            'lack_of_school_fees': self.lack_of_school_fees,
            'job_opportunity': self.job_opportunity,
            'pregnancy': self.pregnancy,
            'family_conflicts': self.family_conflicts,
            'drug_abuse': self.drug_abuse,
            'lack_of_motivation': self.lack_of_motivation,
            'illness': self.illness,
            'absenteeism': self.absenteeism,
            'bad_discipline': self.bad_discipline,

            'at_risk': self.at_risk,
            'risk_probability': self.risk_probability,

            'age_group': self.age_group,
            'recorded_by_id': self.recorded_by_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
