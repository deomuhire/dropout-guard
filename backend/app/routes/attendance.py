from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import date
from .. import db
from ..models.attendance import Attendance
from ..models.student import Student
from ..models.school import School
from ..ml.predictor import predict


from ..utils.auth import get_current_user

attendance_bp = Blueprint('attendance', __name__)

def _teacher_can_access_student(user, student):
    if user.role != 'teacher':
        return False
    from ..models.school import Class
    cls = Class.query.filter_by(teacher_id=user.id).first()
    return bool(cls and student.class_id == cls.id)

def _parse_today_attended(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in ('true', '1', 'yes', 'attended'):
            return True
        if normalized in ('false', '0', 'no', 'not attended'):
            return False
    return None

def _was_not_attended(record):
    if record.today_attended is not None:
        return record.today_attended is False
    return record.absenteeism == 1

@attendance_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_today_attendance(student_id):
    """Get today's record, or the latest previous record to pre-fill the form."""
    current_user = get_current_user()
    student = Student.query.get_or_404(student_id)
    if not _teacher_can_access_student(current_user, student):
        return jsonify({'error': 'Only the assigned teacher can access this form'}), 403

    today = date.today()
    record = Attendance.query.filter_by(
        student_id=student_id, date=today
    ).first()

    if record:
        payload = record.to_dict()
        payload['is_today'] = True
        payload['prefill_source_date'] = record.date.isoformat()
        return jsonify(payload), 200

    record = Attendance.query.filter(
        Attendance.student_id == student_id,
        Attendance.date < today
    ).order_by(Attendance.date.desc()).first()
    if record:
        payload = record.to_dict()
        payload['is_today'] = False
        payload['prefill_source_date'] = record.date.isoformat()
        payload['id'] = None
        payload['date'] = today.isoformat()

        return jsonify(payload), 200
    return jsonify(None), 200


@attendance_bp.route('/student/<int:student_id>', methods=['POST'])
@jwt_required()
def save_attendance(student_id):
    """
    Teacher submits / updates attendance for a student.
    If a record already exists today → UPDATE it.
    If not → CREATE a new one.
    The ML model runs on every save and the result is stored.
    """
    current_user = get_current_user()
    student = Student.query.get_or_404(student_id)
    if not _teacher_can_access_student(current_user, student):
        return jsonify({'error': 'Only the assigned teacher can save this form'}), 403

    data = request.get_json() or {}
    today = date.today()

    today_attended = _parse_today_attended(
        data.get('_today_attended', data.get('today_attended'))
    )

    # Hardening: only accept fields that the ML model/UI are allowed to set.
    allowed_keys = {
        'gender',
        'performance',
        'social_activity',
        'lack_of_school_material',
        'lack_of_school_fees',
        'family_conflicts',
        'drug_abuse',
        'lack_of_motivation',
        'illness',
        'absenteeism',
        'bad_discipline',
    }
    # ML model expects only these fields.
    data = {k: v for k, v in data.items() if k in allowed_keys}



    # Run ML prediction
    result = predict(data)

    existing = Attendance.query.filter_by(
        student_id=student_id, date=today
    ).first()

    if existing:
        # Update existing record with ONLY the fields used by the trained model
        existing.gender                   = data.get('gender', existing.gender)
        existing.performance              = data.get('performance', existing.performance)
        existing.social_activity          = data.get('social_activity', existing.social_activity)
        if today_attended is not None:
            existing.today_attended = today_attended

        existing.lack_of_school_material = int(data.get('lack_of_school_material', 0))
        existing.lack_of_school_fees     = int(data.get('lack_of_school_fees', 0))
        existing.family_conflicts         = int(data.get('family_conflicts', 0))
        existing.drug_abuse               = int(data.get('drug_abuse', 0))
        existing.lack_of_motivation       = int(data.get('lack_of_motivation', 0))
        existing.illness                  = int(data.get('illness', 0))
        existing.absenteeism              = int(data.get('absenteeism', 0))
        existing.bad_discipline           = int(data.get('bad_discipline', 0))


        existing.at_risk = bool(result.get('label') == 1)
        # Store dropout probability percentage (model outputs proba for class=1)
        existing.risk_probability = result['dropout_probability_percent']





        # Also update student gender if provided by teacher.
        # We overwrite whenever it's a valid choice (Male/Female).
        if data.get('gender') in ('Male', 'Female'):
            student.gender = data.get('gender')
        db.session.commit()
        return jsonify({'message': 'Updated', 'prediction': result, 'record': existing.to_dict()}), 200

    else:
        record = Attendance(
            student_id              = student_id,
            date                    = today,
            recorded_by_id          = current_user.id,

            gender                  = data.get('gender'),
            performance             = data.get('performance'),
            social_activity         = data.get('social_activity', 'None'),
            today_attended          = today_attended,
            lack_of_school_material = int(data.get('lack_of_school_material', 0)),
            lack_of_school_fees     = int(data.get('lack_of_school_fees', 0)),
            family_conflicts        = int(data.get('family_conflicts', 0)),
            drug_abuse              = int(data.get('drug_abuse', 0)),
            lack_of_motivation      = int(data.get('lack_of_motivation', 0)),
            illness                 = int(data.get('illness', 0)),
            absenteeism             = int(data.get('absenteeism', 0)),
            bad_discipline          = int(data.get('bad_discipline', 0)),


            at_risk = bool(result.get('label') == 1),
            risk_probability = result['dropout_probability_percent']





        )



        db.session.add(record)
        # Also update student gender if provided by teacher.
        if data.get('gender') in ('Male', 'Female'):
            student.gender = data.get('gender')
        db.session.commit()
        return jsonify({'message': 'Saved', 'prediction': result, 'record': record.to_dict()}), 201


@attendance_bp.route('/class/<int:class_id>/today', methods=['GET'])
@jwt_required()
def get_class_today(class_id):
    """Get today's attendance for all students in a class (for dashboard)."""
    current_user = get_current_user()
    if current_user.role == 'teacher':
        from ..models.school import Class
        cls = Class.query.filter_by(id=class_id, teacher_id=current_user.id).first()
        if not cls:
            return jsonify({'error': 'Not authorized for this class'}), 403
    today = date.today()
    from ..models.student import Student
    students = Student.query.filter_by(class_id=class_id, is_active=True).all()

    result = []
    for student in students:
        record = Attendance.query.filter_by(
            student_id=student.id, date=today
        ).first()
        result.append({
            'student': student.to_dict(),
            'attendance': record.to_dict() if record else None
        })

    return jsonify(result), 200


@attendance_bp.route('/school/<int:school_id>/summary', methods=['GET'])
@jwt_required()
def get_school_summary(school_id):
    """KPI summary for a school on a given date (default: today)."""
    current_user = get_current_user()
    if current_user.role in ('headmaster', 'dos') and current_user.school_id != school_id:
        return jsonify({'error': 'Not authorized for this school'}), 403
    if current_user.role == 'sector_leader':
        from ..models.school import School
        school = School.query.filter_by(id=school_id, created_by_id=current_user.id).first()
        if not school:
            return jsonify({'error': 'Not authorized for this school'}), 403

    date_str = request.args.get('date', str(date.today()))
    try:
        query_date = date.fromisoformat(date_str)
    except ValueError:
        query_date = date.today()

    from ..models.student import Student
    student_ids = [s.id for s in Student.query.filter_by(
        school_id=school_id, is_active=True).all()]

    records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == query_date
    ).all()

    total    = len(records)
    not_attended_count = sum(1 for r in records if _was_not_attended(r))
    all_students = Student.query.filter_by(school_id=school_id, is_active=True).all()

    # KPIs for dashboard
    at_risk_count = sum(1 for r in records if r.at_risk)

    gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
    for r in records:
        gender = r.gender if r.gender in ('Male', 'Female') else (r.student.gender if r.student.gender in ('Male', 'Female') else 'Unknown')
        gender_counts[gender] += 1

    performance_levels = ['0-40', '41-50', '51-60', '61-70', '71-100']
    performance_summary = []
    for level in performance_levels:
        level_records = [r for r in records if r.performance == level]
        level_total = len(level_records)
        performance_summary.append({
            'name': level,
            'total': level_total,
            'at_risk': sum(1 for r in level_records if r.at_risk)
        })

    return jsonify({
        'date':             date_str,
        'total_students':   len(all_students),
        'total_recorded':   total,
        'at_risk_count':    at_risk_count,
        'safe_count':       total - at_risk_count,
        'not_attended_count': not_attended_count,
        'gender_counts':    gender_counts,
        'performance_summary': performance_summary,
        'records':          [{**r.to_dict(), 'student': r.student.to_dict()} for r in records]
    }), 200



@attendance_bp.route('/student/<int:student_id>/risk-factors', methods=['GET'])
@jwt_required()
def student_risk_factors(student_id):
    """
    Returns all attendance records for a student with risk factor details,
    showing which factors were present on each at-risk day.
    """
    current_user = get_current_user()
    student = Student.query.get_or_404(student_id)

    # Authorization check
    if current_user.role == 'teacher':
        from ..models.school import Class
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls or student.class_id != cls.id:
            return jsonify({'error': 'Not authorized'}), 403
    elif current_user.role in ('dos', 'headmaster'):
        if student.school_id != current_user.school_id:
            return jsonify({'error': 'Not authorized'}), 403
    elif current_user.role == 'sector_leader':
        school = School.query.filter_by(id=student.school_id, created_by_id=current_user.id).first()
        if not school:
            return jsonify({'error': 'Not authorized'}), 403

    records = Attendance.query.filter_by(student_id=student_id).order_by(Attendance.date.desc()).all()

    # Aggregate factor counts across all at-risk records
    factor_counts = {}
    at_risk_records = []
    for r in records:
        if not r.at_risk:
            continue
        factors_present = []
        factor_fields = [
            'lack_of_school_material', 'lack_of_school_fees', 'job_opportunity',
            'pregnancy', 'family_conflicts', 'drug_abuse', 'lack_of_motivation',
            'illness', 'absenteeism', 'bad_discipline'
        ]
        for f in factor_fields:
            if getattr(r, f, 0) == 1:
                factors_present.append(f)
                factor_counts[f] = factor_counts.get(f, 0) + 1

        at_risk_records.append({
            'date': r.date.isoformat() if r.date else None,
            'performance': r.performance,
            'factors': factors_present,
        })

    # Sort factor counts by frequency
    sorted_factors = sorted(factor_counts.items(), key=lambda x: x[1], reverse=True)

    return jsonify({
        'student': {
            'id': student.id,
            'name': student.name,
            'student_id': student.student_id,
            'class_name': student.class_.name if student.class_ else 'Unassigned',
            'school_name': student.school.name if student.school else 'Unknown',
        },
        'total_records': len(records),
        'at_risk_records': at_risk_records,
        'factor_counts': sorted_factors,
        'total_at_risk': len(at_risk_records),
    }), 200


@attendance_bp.route('/risk-frequency', methods=['GET'])
@jwt_required()
def risk_frequency():
    """Return per-student risk frequency across ALL attendance records for the scoped users.

    For each student:
      - total_at_risk: number of Attendance rows where at_risk == True (across all dates)
      - at_risk_count: same as total_at_risk
      - not_attended_count: number of Attendance rows marked not attended (across all dates)

    Students with no attendance rows are included with 0 counts.
    """
    current_user = get_current_user()

    if current_user.role == 'teacher':
        from ..models.school import Class
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls:
            return jsonify([])
        student_ids = [s.id for s in cls.students if s.is_active]
    elif current_user.role in ('dos', 'headmaster'):
        student_ids = [s.id for s in Student.query.filter_by(
            school_id=current_user.school_id, is_active=True).all()]
    elif current_user.role == 'sector_leader':
        school_ids = [sc.id for sc in School.query.filter_by(
            created_by_id=current_user.id).all()]
        student_ids = [s.id for s in Student.query.filter(
            Student.school_id.in_(school_ids), Student.is_active == True).all()]
    elif current_user.role == 'superadmin':
        student_ids = [s.id for s in Student.query.filter_by(is_active=True).all()]
    else:
        return jsonify({'error': 'Not authorized'}), 403

    if not student_ids:
        return jsonify([])

    # Total distinct attendance dates recorded for these students (for context)
    all_records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids)
    ).all()
    attendance_made_count = len({r.date for r in all_records if r.date})

    # Initialize counts for every student_id so missing records still appear
    freq_map = {
        sid: {
            'not_attended_count': 0,
            'at_risk_count': 0,
        }
        for sid in student_ids
    }

    for r in all_records:
        sid = r.student_id
        if sid not in freq_map:
            continue

        if r.at_risk is True:
            freq_map[sid]['at_risk_count'] += 1

        if _was_not_attended(r):
            freq_map[sid]['not_attended_count'] += 1

    result = []
    students = Student.query.filter(Student.id.in_(student_ids)).all()
    for student in students:
        counts = freq_map.get(student.id, {
            'not_attended_count': 0,
            'at_risk_count': 0,
        })

        result.append({
            'student_id': student.id,
            'student_code': student.student_id,
            'name': student.name,
            'gender': student.gender,
            'class_name': student.class_.name if student.class_ else 'Unassigned',
            'school_name': student.school.name if student.school else 'Unknown',
            'not_attended_count': counts['not_attended_count'],
            'at_risk_count': counts['at_risk_count'],
            'total_at_risk': counts['at_risk_count'],
            'attendance_made_count': attendance_made_count,
        })

    # Sort: most not-attended first
    result.sort(key=lambda x: x['not_attended_count'], reverse=True)
    return jsonify(result), 200




@attendance_bp.route('/class/summary', methods=['GET'])
@jwt_required()
def get_class_summary():
    """KPI summary for teacher's class on a given date (default: today)."""
    current_user = get_current_user()
    if current_user.role != 'teacher':
        return jsonify({'error': 'Only teachers can access this'}), 403

    from ..models.school import Class
    cls = Class.query.filter_by(teacher_id=current_user.id).first()
    if not cls:
        return jsonify({'error': 'No class assigned'}), 404

    date_str = request.args.get('date', str(date.today()))
    try:
        query_date = date.fromisoformat(date_str)
    except ValueError:
        query_date = date.today()

    student_ids = [s.id for s in cls.students if s.is_active]

    records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == query_date
    ).all()

    total    = len(records)
    at_risk  = sum(1 for r in records if r.at_risk)

    gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
    for r in records:
        gender = r.gender if r.gender in ('Male', 'Female') else (r.student.gender if r.student.gender in ('Male', 'Female') else 'Unknown')
        gender_counts[gender] += 1

    performance_levels = ['0-40', '41-50', '51-60', '61-70', '71-100']
    performance_summary = []
    for level in performance_levels:
        level_records = [r for r in records if r.performance == level]
        level_total = len(level_records)
        performance_summary.append({
            'name': level,
            'total': level_total,
            'at_risk': sum(1 for r in level_records if r.at_risk)
        })

    return jsonify({
        'date':             date_str,
        'total_students':   len(student_ids),
        'total_recorded':   total,
        'at_risk_count':    at_risk,
        'safe_count':       total - at_risk,
        'gender_counts':    gender_counts,
        'performance_summary': performance_summary,
        'records':          [{**r.to_dict(), 'student': r.student.to_dict()} for r in records]
    }), 200
