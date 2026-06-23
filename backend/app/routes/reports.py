from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from datetime import date, timedelta
import io
from .. import db
from ..models.attendance import Attendance
from ..models.student import Student
from ..models.school import School, Class
from ..models.user import User
from ..utils.auth import get_current_user
from ..utils.pdf import generate_daily_report

reports_bp = Blueprint('reports', __name__)

def _can_access_school(user, school_id):
    if user.role == 'superadmin':
        return True
    if user.role in ('headmaster', 'dos', 'teacher') and user.school_id == school_id:
        return True
    if user.role == 'sector_leader':
        return School.query.filter_by(id=school_id, created_by_id=user.id).first() is not None
    return False

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


@reports_bp.route('/school/<int:school_id>/download', methods=['GET'])
@jwt_required()
def download_report(school_id):
    """
    Download a PDF report for a school on a given date.
    Teachers see only their class; others see school-wide.
    Query param: ?date=2024-01-15   (default: today)
    """
    date_str = request.args.get('date', str(date.today()))
    try:
        query_date = date.fromisoformat(date_str)
    except ValueError:
        query_date = date.today()

    school = School.query.get_or_404(school_id)
    current_user = get_current_user()
    if not _can_access_school(current_user, school_id):
        return jsonify({'error': 'Not authorized for this school'}), 403

    class_id = request.args.get('class_id', type=int)

    # Get students: teachers see only their class, others can optionally filter by class.
    class_name = None
    if current_user.role == 'teacher':
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls:
            return jsonify({'error': 'No class assigned'}), 404
        all_students = [s for s in cls.students if s.is_active]
        class_name = cls.name
    elif class_id:
        cls = Class.query.filter_by(id=class_id, school_id=school_id).first()
        if not cls:
            return jsonify({'error': 'Class not found in this school'}), 404
        all_students = [s for s in cls.students if s.is_active]
        class_name = cls.name
    else:
        all_students = Student.query.filter_by(school_id=school_id, is_active=True).all()
    
    # Get attendance records
    student_ids = [s.id for s in all_students]
    records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == query_date
    ).all() if student_ids else []
    record_map = {r.student_id: r for r in records}

    # Build full student data (including students without records)
    students_data = []
    for student in all_students:
        record = record_map.get(student.id)
        students_data.append({
            **student.to_dict(),
            'at_risk': record.at_risk if record else None,
            'performance': record.performance if record else None,
            'year_of_study': record.year_of_study if record else None,
            'social_activity': record.social_activity if record else None,
            'has_record': record is not None,
            'lack_of_school_material': record.lack_of_school_material if record else False,
            'lack_of_school_fees': record.lack_of_school_fees if record else False,
            'job_opportunity': record.job_opportunity if record else False,
            'pregnancy': record.pregnancy if record else False,
            'family_conflicts': record.family_conflicts if record else False,
            'drug_abuse': record.drug_abuse if record else False,
            'lack_of_motivation': record.lack_of_motivation if record else False,
            'illness': record.illness if record else False,
            'absenteeism': record.absenteeism if record else False,
            'bad_discipline': record.bad_discipline if record else False,
        })
        # Use attendance gender as fallback for the report date
        if record and record.gender in ('Male', 'Female') and students_data[-1].get('gender') not in ('Male', 'Female'):
            students_data[-1]['gender'] = record.gender

    # Compute summary statistics
    total_students = len(all_students)
    total_recorded = len(records)
    at_risk_count = sum(1 for r in records if r.at_risk)
    safe_count = total_recorded - at_risk_count
    pending_count = total_students - total_recorded

    gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
    for s in all_students:
        gender = s.gender if s.gender in ('Male', 'Female') else (record_map.get(s.id).gender if record_map.get(s.id) and record_map.get(s.id).gender in ('Male', 'Female') else 'Unknown')
        gender_counts[gender] += 1

    performance_summary = []
    for level in ['0-40', '41-50', '51-60', '61-70', '71-100']:
        level_records = [r for r in records if r.performance == level]
        performance_summary.append({
            'name': level,
            'total': len(level_records),
            'at_risk': sum(1 for r in level_records if r.at_risk)
        })

    risk_factors = {
        'lack_of_school_material': sum(1 for r in records if r.lack_of_school_material),
        'lack_of_school_fees': sum(1 for r in records if r.lack_of_school_fees),
        'job_opportunity': sum(1 for r in records if r.job_opportunity),
        'pregnancy': sum(1 for r in records if r.pregnancy),
        'family_conflicts': sum(1 for r in records if r.family_conflicts),
        'drug_abuse': sum(1 for r in records if r.drug_abuse),
        'lack_of_motivation': sum(1 for r in records if r.lack_of_motivation),
        'illness': sum(1 for r in records if r.illness),
        'absenteeism': sum(1 for r in records if r.absenteeism),
        'bad_discipline': sum(1 for r in records if r.bad_discipline),
    }

    social_activities = {}
    for r in records:
        sa = r.social_activity or 'Unknown'
        social_activities[sa] = social_activities.get(sa, 0) + 1

    class_stats = {}
    for student in all_students:
        cls_name = student.class_.name if student.class_ else 'Unassigned'
        if cls_name not in class_stats:
            class_stats[cls_name] = {'total': 0, 'at_risk': 0, 'safe': 0, 'pending': 0}
        class_stats[cls_name]['total'] += 1
        rec = record_map.get(student.id)
        if rec:
            if rec.at_risk:
                class_stats[cls_name]['at_risk'] += 1
            else:
                class_stats[cls_name]['safe'] += 1
        else:
            class_stats[cls_name]['pending'] += 1

    summary = {
        'total_students': total_students, 'total_recorded': total_recorded,
        'at_risk_count': at_risk_count, 'safe_count': safe_count, 'pending_count': pending_count,
        'gender_counts': gender_counts, 'performance_summary': performance_summary,
        'risk_factors': risk_factors,
        'social_activities': social_activities, 'class_stats': class_stats,
    }

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


@reports_bp.route('/sector/<int:sector_leader_id>', methods=['GET'])
@jwt_required()
def sector_summary(sector_leader_id):
    """Sector leader: summary across all their schools."""
    current_user = get_current_user()
    if current_user.role != 'sector_leader' or current_user.id != sector_leader_id:
        return jsonify({'error': 'Not authorized'}), 403
    schools = School.query.filter_by(created_by_id=sector_leader_id).all()
    today = date.today()
    summary = []

    for school in schools:
        student_ids = [s.id for s in Student.query.filter_by(
            school_id=school.id, is_active=True).all()]
        records = Attendance.query.filter(
            Attendance.student_id.in_(student_ids),
            Attendance.date == today
        ).all()
        all_students = Student.query.filter_by(school_id=school.id, is_active=True).all()
        total   = len(records)
        at_risk = sum(1 for r in records if r.at_risk)
        gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
        for r in records:
            gender = r.gender if r.gender in ('Male', 'Female') else (r.student.gender if r.student.gender in ('Male', 'Female') else 'Unknown')
            gender_counts[gender] += 1
        for student in all_students:
            if student.gender in ('Male', 'Female') and student.id not in [r.student_id for r in records if r.gender in ('Male', 'Female')]:
                gender_counts[student.gender] += 1
            elif student.gender not in ('Male', 'Female'):
                # Check if any attendance record has gender for this student
                student_records = [r for r in records if r.student_id == student.id]
                if not student_records or not any(r.gender in ('Male', 'Female') for r in student_records):
                    gender_counts['Unknown'] += 1
        summary.append({
            'school':        school.to_dict(),
            'students':      len(all_students),
            'total':         total,
            'at_risk':       at_risk,
            'safe':          total - at_risk,
            'gender_counts': gender_counts
        })

    return jsonify(summary), 200


@reports_bp.route('/sector/<int:sector_leader_id>/download', methods=['GET'])
@jwt_required()
def download_sector_report(sector_leader_id):
    current_user = get_current_user()
    if current_user.role != 'sector_leader' or current_user.id != sector_leader_id:
        return jsonify({'error': 'Not authorized'}), 403

    date_str = request.args.get('date', str(date.today()))
    try:
        query_date = date.fromisoformat(date_str)
    except ValueError:
        query_date = date.today()

    schools = School.query.filter_by(created_by_id=sector_leader_id).all()
    all_students = []
    for school in schools:
        all_students.extend(Student.query.filter_by(school_id=school.id, is_active=True).all())

    student_ids = [s.id for s in all_students]
    records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == query_date
    ).all() if student_ids else []
    record_map = {r.student_id: r for r in records}

    students_data = []
    for student in all_students:
        record = record_map.get(student.id)
        students_data.append({
            **student.to_dict(),
            'at_risk': record.at_risk if record else None,
            'performance': record.performance if record else None,
            'year_of_study': record.year_of_study if record else None,
            'social_activity': record.social_activity if record else None,
            'has_record': record is not None,
            'lack_of_school_material': record.lack_of_school_material if record else False,
            'lack_of_school_fees': record.lack_of_school_fees if record else False,
            'job_opportunity': record.job_opportunity if record else False,
            'pregnancy': record.pregnancy if record else False,
            'family_conflicts': record.family_conflicts if record else False,
            'drug_abuse': record.drug_abuse if record else False,
            'lack_of_motivation': record.lack_of_motivation if record else False,
            'illness': record.illness if record else False,
            'absenteeism': record.absenteeism if record else False,
            'bad_discipline': record.bad_discipline if record else False,
        })
        if record and record.gender in ('Male', 'Female') and students_data[-1].get('gender') not in ('Male', 'Female'):
            students_data[-1]['gender'] = record.gender

    total_students = len(all_students)
    total_recorded = len(records)
    at_risk_count = sum(1 for r in records if r.at_risk)
    safe_count = total_recorded - at_risk_count
    pending_count = total_students - total_recorded

    gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
    for student in all_students:
        gender = student.gender if student.gender in ('Male', 'Female') else (
            record_map.get(student.id).gender if record_map.get(student.id) and record_map.get(student.id).gender in ('Male', 'Female') else 'Unknown'
        )
        gender_counts[gender] += 1

    performance_summary = []
    for level in ['0-40', '41-50', '51-60', '61-70', '71-100']:
        level_records = [r for r in records if r.performance == level]
        performance_summary.append({
            'name': level,
            'total': len(level_records),
            'at_risk': sum(1 for r in level_records if r.at_risk)
        })

    risk_factors = {
        'lack_of_school_material': sum(1 for r in records if r.lack_of_school_material),
        'lack_of_school_fees': sum(1 for r in records if r.lack_of_school_fees),
        'job_opportunity': sum(1 for r in records if r.job_opportunity),
        'pregnancy': sum(1 for r in records if r.pregnancy),
        'family_conflicts': sum(1 for r in records if r.family_conflicts),
        'drug_abuse': sum(1 for r in records if r.drug_abuse),
        'lack_of_motivation': sum(1 for r in records if r.lack_of_motivation),
        'illness': sum(1 for r in records if r.illness),
        'absenteeism': sum(1 for r in records if r.absenteeism),
        'bad_discipline': sum(1 for r in records if r.bad_discipline),
    }

    social_activities = {}
    for r in records:
        sa = r.social_activity or 'Unknown'
        social_activities[sa] = social_activities.get(sa, 0) + 1

    summary = {
        'total_students': total_students,
        'total_recorded': total_recorded,
        'at_risk_count': at_risk_count,
        'safe_count': safe_count,
        'pending_count': pending_count,
        'gender_counts': gender_counts,
        'performance_summary': performance_summary,
        'risk_factors': risk_factors,
        'social_activities': social_activities,
        'class_stats': {}
    }

    pdf_bytes = generate_daily_report(
        school_name='All schools',
        report_date=date_str,
        students_data=students_data,
        summary=summary,
        is_teacher_view=False,
        location=None
    )

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"report_All_schools_{date_str}.pdf"
    )


@reports_bp.route('/superadmin/sector/<int:leader_id>', methods=['GET'])
@jwt_required()
def superadmin_sector_summary(leader_id):
    """Superadmin: view sector summary for a specific sector leader."""
    current_user = get_current_user()
    if current_user.role != 'superadmin':
        return jsonify({'error': 'Only superadmin can access this'}), 403
    leader = User.query.filter_by(id=leader_id, created_by_id=current_user.id, role='sector_leader').first()
    if not leader:
        return jsonify({'error': 'Sector leader not found'}), 404
    schools = School.query.filter_by(created_by_id=leader_id).all()
    today = date.today()
    summary = []

    for school in schools:
        student_ids = [s.id for s in Student.query.filter_by(
            school_id=school.id, is_active=True).all()]
        records = Attendance.query.filter(
            Attendance.student_id.in_(student_ids),
            Attendance.date == today
        ).all()
        all_students = Student.query.filter_by(school_id=school.id, is_active=True).all()
        total   = len(records)
        at_risk = sum(1 for r in records if r.at_risk)
        gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
        for r in records:
            gender = r.gender if r.gender in ('Male', 'Female') else (r.student.gender if r.student.gender in ('Male', 'Female') else 'Unknown')
            gender_counts[gender] += 1
        for student in all_students:
            if student.gender in ('Male', 'Female') and student.id not in [r.student_id for r in records if r.gender in ('Male', 'Female')]:
                gender_counts[student.gender] += 1
            elif student.gender not in ('Male', 'Female'):
                # Check if any attendance record has gender for this student
                student_records = [r for r in records if r.student_id == student.id]
                if not student_records or not any(r.gender in ('Male', 'Female') for r in student_records):
                    gender_counts['Unknown'] += 1

        summary.append({
            'school':        school.to_dict(),
            'students':      len(all_students),
            'total':         total,
            'at_risk':       at_risk,
            'safe':          total - at_risk,
            'gender_counts': gender_counts
        })

    return jsonify({'leader': leader.to_dict(), 'schools': summary}), 200


@reports_bp.route('/school/<int:school_id>/detail', methods=['GET'])
@jwt_required()
def school_detail_report(school_id):
    """Detailed report for a school on a given date with full student+attendance data."""
    current_user = get_current_user()
    if not _can_access_school(current_user, school_id):
        return jsonify({'error': 'Not authorized for this school'}), 403

    school = School.query.get_or_404(school_id)
    date_str = request.args.get('date', str(date.today()))
    try:
        query_date = date.fromisoformat(date_str)
    except ValueError:
        query_date = date.today()

    class_id = request.args.get('class_id', type=int)

    # Teachers see only their class; others can optionally filter by class.
    if current_user.role == 'teacher':
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls:
            return jsonify({
                'school': school.to_dict(),
                'date': date_str,
                'class_name': None,
                'is_teacher_view': True,
                'students': [],
                'summary': {
                    'total_students': 0, 'total_recorded': 0,
                    'at_risk_count': 0, 'safe_count': 0, 'pending_count': 0,
                    'gender_counts': {'Male': 0, 'Female': 0, 'Unknown': 0},
                    'performance_summary': [],
                    'risk_factors': {},
                    'social_activities': {},
                    'class_stats': {}
                }
            }), 200
        all_students = [s for s in cls.students if s.is_active]
        class_name = cls.name
    elif class_id:
        cls = Class.query.filter_by(id=class_id, school_id=school_id).first()
        if not cls:
            return jsonify({'error': 'Class not found in this school'}), 404
        all_students = [s for s in cls.students if s.is_active]
        class_name = cls.name
    else:
        all_students = Student.query.filter_by(school_id=school_id, is_active=True).all()
        class_name = None

    # Get attendance records for the date
    student_ids = [s.id for s in all_students]
    records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == query_date
    ).all() if student_ids else []
    record_map = {r.student_id: r for r in records}

    # Build detailed student data
    students_data = []
    for student in all_students:
        record = record_map.get(student.id)
        students_data.append({
            'student': student.to_dict(),
            'attendance': record.to_dict() if record else None,
            'has_record': record is not None
        })
        # Use attendance gender as fallback for the report date
        if record and record.gender in ('Male', 'Female') and students_data[-1]['student'].get('gender') not in ('Male', 'Female'):
            students_data[-1]['student']['gender'] = record.gender

    # Compute summary statistics
    total_students = len(all_students)
    total_recorded = len(records)
    at_risk_count = sum(1 for r in records if r.at_risk)
    safe_count = total_recorded - at_risk_count
    pending_count = total_students - total_recorded

    # Gender distribution
    gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
    for s in all_students:
        gender = s.gender if s.gender in ('Male', 'Female') else (record_map.get(s.id).gender if record_map.get(s.id) and record_map.get(s.id).gender in ('Male', 'Female') else 'Unknown')
        gender_counts[gender] += 1

    # Performance distribution
    performance_summary = []
    for level in ['0-40', '41-50', '51-60', '61-70', '71-100']:
        level_records = [r for r in records if r.performance == level]
        performance_summary.append({
            'name': level,
            'total': len(level_records),
            'at_risk': sum(1 for r in level_records if r.at_risk)
        })

    # Risk factor analysis (count how many students have each factor)
    risk_factors = {
        'lack_of_school_material': sum(1 for r in records if r.lack_of_school_material),
        'lack_of_school_fees': sum(1 for r in records if r.lack_of_school_fees),
        'job_opportunity': sum(1 for r in records if r.job_opportunity),
        'pregnancy': sum(1 for r in records if r.pregnancy),
        'family_conflicts': sum(1 for r in records if r.family_conflicts),
        'drug_abuse': sum(1 for r in records if r.drug_abuse),
        'lack_of_motivation': sum(1 for r in records if r.lack_of_motivation),
        'illness': sum(1 for r in records if r.illness),
        'absenteeism': sum(1 for r in records if r.absenteeism),
        'bad_discipline': sum(1 for r in records if r.bad_discipline),
    }

    # Age group distribution
    # Social activity distribution
    social_activities = {}
    for r in records:
        sa = r.social_activity or 'Unknown'
        social_activities[sa] = social_activities.get(sa, 0) + 1

    # Class distribution
    class_stats = {}
    for student in all_students:
        cls_name = student.class_.name if student.class_ else 'Unassigned'
        if cls_name not in class_stats:
            class_stats[cls_name] = {'total': 0, 'at_risk': 0, 'safe': 0, 'pending': 0}
        class_stats[cls_name]['total'] += 1
        record = record_map.get(student.id)
        if record:
            if record.at_risk:
                class_stats[cls_name]['at_risk'] += 1
            else:
                class_stats[cls_name]['safe'] += 1
        else:
            class_stats[cls_name]['pending'] += 1

    return jsonify({
        'school': school.to_dict(),
        'date': date_str,
        'class_name': class_name,
        'is_teacher_view': current_user.role == 'teacher' or bool(class_id),
        'students': students_data,
        'summary': {
            'total_students': total_students,
            'total_recorded': total_recorded,
            'at_risk_count': at_risk_count,
            'safe_count': safe_count,
            'pending_count': pending_count,
            'gender_counts': gender_counts,
            'performance_summary': performance_summary,
            'risk_factors': risk_factors,
            'social_activities': social_activities,
            'class_stats': class_stats
        }
    }), 200
