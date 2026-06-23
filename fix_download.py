import os

base = os.path.dirname(os.path.abspath(__file__))
reports_path = os.path.join(base, "backend", "app", "routes", "reports.py")

with open(reports_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the download function and replace lines 72-109 (0-indexed: 71-108)
# First find the exact line numbers
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if "# Get all_students: teachers see only their class" in line:
        start_idx = i
    if start_idx and "class_name=class_name" in line and end_idx is None and i > start_idx:
        # Find the closing paren line
        end_idx = i + 1
        break

print(f"Found download code at lines {start_idx+1}-{end_idx+1}")

new_code = """    # Get students: teachers see only their class, others see school-wide
    class_name = None
    if current_user.role == 'teacher':
        from ..models.school import Class
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls:
            return jsonify({'error': 'No class assigned'}), 404
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
            'risk_probability': record.risk_probability if record else None,
            'performance': record.performance if record else None,
            'year_of_study': record.year_of_study if record else None,
            'age_group': record.age_group if record else None,
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

    # Compute summary statistics
    total_students = len(all_students)
    total_recorded = len(records)
    at_risk_count = sum(1 for r in records if r.at_risk)
    safe_count = total_recorded - at_risk_count
    pending_count = total_students - total_recorded

    low_risk = sum(1 for r in records if r.at_risk and 60 <= r.risk_probability <= 70)
    medium_risk = sum(1 for r in records if r.at_risk and 80 <= r.risk_probability <= 90)
    high_risk = sum(1 for r in records if r.at_risk and r.risk_probability > 90)

    gender_counts = {'Male': 0, 'Female': 0, 'Unknown': 0}
    for s in all_students:
        gender = s.gender if s.gender in ('Male', 'Female') else 'Unknown'
        gender_counts[gender] += 1

    performance_summary = []
    for level in ['0-40', '41-50', '51-60', '61-70', '71-100']:
        level_records = [r for r in records if r.performance == level]
        performance_summary.append({
            'name': level, 'total': len(level_records),
            'at_risk': sum(1 for r in level_records if r.at_risk),
            'avg_risk': round(sum(r.risk_probability for r in level_records) / len(level_records), 1) if level_records else 0
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

    age_groups = {}
    for r in records:
        ag = r.age_group or 'Unknown'
        age_groups[ag] = age_groups.get(ag, 0) + 1

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
        'low_risk_count': low_risk, 'medium_risk_count': medium_risk, 'high_risk_count': high_risk,
        'gender_counts': gender_counts, 'performance_summary': performance_summary,
        'risk_factors': risk_factors, 'age_groups': age_groups,
        'social_activities': social_activities, 'class_stats': class_stats,
    }

    # Generate PDF
    pdf_bytes = generate_daily_report(
        school_name=school.name,
        report_date=date_str,
        students_data=students_data,
        class_name=class_name,
        summary=summary,
        is_teacher_view=current_user.role == 'teacher',
        location={'province': school.province, 'district': school.district, 'sector': school.sector}
    )
"""

if start_idx is not None and end_idx is not None:
    new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]
    with open(reports_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("Successfully updated download endpoint!")
else:
    print(f"ERROR: Could not find code boundaries (start={start_idx}, end={end_idx})")

# Cleanup
os.remove(os.path.join(base, "fix_download.py"))
