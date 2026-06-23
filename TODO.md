# TODO (Student Dropout Detection - New Model Integration)

- [ ] Inspect ML predictor and attendance endpoints for how inputs are encoded and how predictions are returned
- [ ] Update `backend/app/ml/predictor.py` to load `student_model21.pkl` (and remove all references to `student_model2.pkl`)
- [ ] Update `encode_input` preprocessing to exactly match the training pipeline (dummy encoding for categorical columns, missing Social_activity filled with 'None', binary features passthrough)
- [ ] Ensure feature alignment uses `model.feature_names_in_` and fills missing dummy columns with 0
- [ ] Apply the non-default prediction threshold rule: dropout label = 1 if proba[:,1] >= 0.60 else 0
- [ ] Update prediction output from the API to return both label and dropout probability percentage (and keep safe probability if already used)
- [ ] Verify no other files reference `student_model2.pkl`
- [ ] Quick runtime check (Flask start / smoke request)

<!--
Attendance storage notes from backend inspection:

1. There is no app code that deletes or clears attendance records after each day.

2. The `attendance` table stores historical records, one row per `student_id + date`.

Attendance model:

```python
class Attendance(db.Model):
    __tablename__ = 'attendance'
    __table_args__ = (
        db.UniqueConstraint('student_id', 'date', name='uq_attendance_student_date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
```

That unique constraint means the database allows one attendance record per student per day, so older days can stay stored.

3. Save logic checks only today's record. Submitting again updates today's row. Tomorrow, it creates a new row.

```python
existing = Attendance.query.filter_by(
    student_id=student_id, date=today
).first()

if existing:
    # update today's record
else:
    # create today's record
```

4. Dashboard summary endpoints query only one date by default: today, unless a `date` query param is provided.

School dashboard summary:

```python
date_str = request.args.get('date', str(date.today()))
query_date = date.fromisoformat(date_str)

records = Attendance.query.filter(
    Attendance.student_id.in_(student_ids),
    Attendance.date == query_date
).all()
```

Teacher class dashboard summary:

```python
date_str = request.args.get('date', str(date.today()))

records = Attendance.query.filter(
    Attendance.student_id.in_(student_ids),
    Attendance.date == query_date
).all()
```

So dashboards use today's attendance by default, not all history.

5. Historical data is still used elsewhere. For example, student risk frequency loads all records for a student:

```python
records = Attendance.query.filter_by(student_id=student_id).order_by(Attendance.date.desc()).all()
```

Search result: no automatic attendance deletion code was found in `backend/app`.
-->

<!--
Daily reports storage notes from backend inspection:

1. There is no `reports` table/model in the database code.

The backend model files are:

```text
backend/app/models/attendance.py
backend/app/models/school.py
backend/app/models/student.py
backend/app/models/user.py
```

No `report.py` model exists, and no model class with `__tablename__ = 'reports'` was found.

2. Reports are generated on the fly from the `attendance` table each time the user opens report details or clicks Download PDF.

The reports route imports the attendance model and PDF generator:

```python
from ..models.attendance import Attendance
from ..utils.pdf import generate_daily_report
```

3. Endpoint that lists reports by date for the reports page:

```python
@reports_bp.route('/school/<int:school_id>', methods=['GET'])
@jwt_required()
def list_school_reports(school_id):
    """
    Returns list of dates that have attendance records for this school or teacher's class.
    Each date = one report available.
    """
    current_user = get_current_user()
    if not _can_access_school(current_user, school_id):
        return jsonify({'error': 'Not authorized for this school'}), 403

    class_id = request.args.get('class_id', type=int)

    # Teachers see only their class attendance; others can optionally filter by class.
    if current_user.role == 'teacher':
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls:
            return jsonify([]), 200
        student_ids = [s.id for s in cls.students if s.is_active]
    elif class_id:
        cls = Class.query.filter_by(id=class_id, school_id=school_id).first()
        if not cls:
            return jsonify({'error': 'Class not found in this school'}), 404
        student_ids = [s.id for s in cls.students if s.is_active]
    else:
        student_ids = [s.id for s in Student.query.filter_by(
            school_id=school_id, is_active=True).all()]

    dates = db.session.query(Attendance.date).filter(
        Attendance.student_id.in_(student_ids)
    ).distinct().order_by(Attendance.date.desc()).all()

    return jsonify([{'date': d[0].isoformat()} for d in dates]), 200
```

This means the reports page is not reading saved report files. It lists every distinct date that has attendance records.

4. Endpoint used when Download PDF is clicked:

```python
@reports_bp.route('/school/<int:school_id>/download', methods=['GET'])
@jwt_required()
def download_report(school_id):
    """
    Download a PDF report for a school on a given date.
    Teachers see only their class; others see school-wide.
    Query param: ?date=2024-01-15   (default: today)
    """
    date_str = request.args.get('date', str(date.today()))
    query_date = date.fromisoformat(date_str)

    # Get attendance records
    student_ids = [s.id for s in all_students]
    records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == query_date
    ).all() if student_ids else []

    # Generate PDF
    pdf_bytes = generate_daily_report(
        school_name=school.name,
        report_date=date_str,
        students_data=students_data,
        class_name=class_name,
        summary=summary,
        is_teacher_view=current_user.role == 'teacher' or bool(class_id),
        location={'province': school.province, 'district': school.district, 'sector': school.sector}
    )

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"report_{school.name}_{date_str}.pdf"
    )
```

So the PDF is generated at request time from attendance records for the selected date.
-->

