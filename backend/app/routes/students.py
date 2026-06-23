from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import csv
import io
from .. import db
from ..models.student import Student
from ..utils.auth import get_current_user

students_bp = Blueprint('students', __name__)

@students_bp.route('/', methods=['GET'])
@jwt_required()
def list_students():
    current_user = get_current_user()

    if current_user.role == 'teacher':
        # Teacher sees students in their assigned class
        from ..models.school import Class
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls:
            return jsonify([]), 200
        students = Student.query.filter_by(class_id=cls.id, is_active=True).all()

    elif current_user.role in ('headmaster', 'dos'):
        students = Student.query.filter_by(
            school_id=current_user.school_id, is_active=True
        ).all()

    elif current_user.role == 'sector_leader':
        from ..models.school import School
        school_ids = [s.id for s in School.query.filter_by(
            created_by_id=current_user.id).all()]
        students = Student.query.filter(
            Student.school_id.in_(school_ids), Student.is_active == True
        ).all()

    elif current_user.role == 'superadmin':
        # Superadmin can optionally filter by leader_id
        leader_id = request.args.get('leader_id', type=int)
        if leader_id:
            from ..models.user import User
            leader = User.query.filter_by(id=leader_id, created_by_id=current_user.id, role='sector_leader').first()
            if not leader:
                return jsonify({'error': 'Sector leader not found'}), 404
            school_ids = [s.id for s in School.query.filter_by(created_by_id=leader_id).all()]
            students = Student.query.filter(
                Student.school_id.in_(school_ids), Student.is_active == True
            ).all()
        else:
            students = Student.query.filter_by(is_active=True).all()

    else:
        students = []

    return jsonify([s.to_dict() for s in students]), 200


@students_bp.route('/', methods=['POST'])
@jwt_required()
def create_student():
    current_user = get_current_user()
    if current_user.role not in ('teacher', 'dos', 'headmaster'):
        return jsonify({'error': 'Not authorized'}), 403

    data = request.get_json()
    school_id = data.get('school_id') or current_user.school_id
    class_id = data.get('class_id')

    if current_user.role == 'teacher':
        from ..models.school import Class
        assigned_class = Class.query.filter_by(teacher_id=current_user.id).first()
        if not assigned_class:
            return jsonify({'error': 'You are not assigned to a class'}), 403
        school_id = current_user.school_id
        class_id = assigned_class.id
    elif school_id != current_user.school_id:
        return jsonify({'error': 'Not authorized for this school'}), 403

    if class_id:
        from ..models.school import Class
        cls = Class.query.filter_by(id=class_id, school_id=school_id).first()
        if not cls:
            return jsonify({'error': 'Class not found in this school'}), 404

    if Student.query.filter_by(student_id=data['student_id']).first():
        return jsonify({'error': 'Student ID already exists'}), 409

    student = Student(
        student_id = data['student_id'],
        name       = data['name'],
        guardian   = data.get('guardian', ''),
        village    = data.get('village', ''),
        gender     = data.get('gender', ''),
        school_id  = school_id,
        class_id   = class_id
    )
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


@students_bp.route('/import-csv', methods=['POST'])
@jwt_required()
def import_students_csv():
    current_user = get_current_user()
    if current_user.role != 'dos':
        return jsonify({'error': 'Only DOS can upload student CSV files'}), 403

    file = request.files.get('file')
    class_name = (request.form.get('class_name') or '').strip().upper()
    replace_flag = (request.form.get('replace') or 'false').strip().lower() == 'true'
    if not file:
        return jsonify({'error': 'CSV file is required'}), 400
    if class_name not in {'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P6A'}:
        return jsonify({'error': 'Class must be one of P1, P2, P3, P4, P5, P6 or P6A'}), 400

    from ..models.school import Class
    cls = Class.query.filter_by(name=class_name, school_id=current_user.school_id).first()
    if not cls:
        cls = Class(name=class_name, school_id=current_user.school_id)
        db.session.add(cls)
        db.session.flush()
    elif replace_flag:
        Student.query.filter_by(
            class_id=cls.id,
            school_id=current_user.school_id,
            is_active=True
        ).update({'is_active': False}, synchronize_session='fetch')
        db.session.flush()

    try:
        stream = io.StringIO(file.stream.read().decode('utf-8-sig'), newline=None)
        reader = csv.DictReader(stream)
    except UnicodeDecodeError:
        return jsonify({'error': 'CSV must be encoded as UTF-8'}), 400

    required = {
        'studentid': ['studentid', 'student_id', 'student id'],
        'name': ['student name', 'student_name', 'name'],
        'guardian': ['student guidian', 'student guardian', 'guardian', 'guidian'],
        'village': ['village'],
        'gender': ['gender', 'sex']
    }

    if not reader.fieldnames:
        return jsonify({'error': 'CSV is empty or missing headers'}), 400

    normalized_headers = {h.strip().lower(): h for h in reader.fieldnames}
    header_map = {}
    for field, aliases in required.items():
        matched = next((normalized_headers[a] for a in aliases if a in normalized_headers), None)
        if not matched and field != 'gender':
            return jsonify({
                'error': 'CSV headers must include studentid, student name, student guidian, village'
            }), 400
        header_map[field] = matched

    created = 0
    updated = 0
    skipped = []

    for line_number, row in enumerate(reader, start=2):
        student_id = (row.get(header_map['studentid']) or '').strip()
        name = (row.get(header_map['name']) or '').strip()
        guardian = (row.get(header_map['guardian']) or '').strip()
        village = (row.get(header_map['village']) or '').strip()
        gender = (row.get(header_map['gender']) or '').strip().title() if header_map.get('gender') else ''
        if gender not in ('Male', 'Female'):
            gender = ''

        if not student_id or not name:
            skipped.append({'line': line_number, 'reason': 'studentid and student name are required'})
            continue

        student = Student.query.filter_by(student_id=student_id).first()
        if student and student.school_id != current_user.school_id:
            skipped.append({'line': line_number, 'studentid': student_id, 'reason': 'student ID belongs to another school'})
            continue

        if student:
            student.name = name
            student.guardian = guardian
            student.village = village
            student.gender = gender or student.gender
            student.class_id = cls.id
            student.is_active = True
            updated += 1
        else:
            db.session.add(Student(
                student_id=student_id,
                name=name,
                guardian=guardian,
                village=village,
                gender=gender,
                school_id=current_user.school_id,
                class_id=cls.id,
                is_active=True
            ))
            created += 1

    db.session.commit()
    return jsonify({
        'message': 'CSV import completed',
        'class': cls.to_dict(),
        'created': created,
        'updated': updated,
        'skipped': skipped,
        'replaced': replace_flag
    }), 201


@students_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student(student_id):
    current_user = get_current_user()
    student = Student.query.get_or_404(student_id)
    if current_user.role == 'teacher':
        from ..models.school import Class
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls or student.class_id != cls.id:
            return jsonify({'error': 'Not authorized'}), 403
    elif current_user.role in ('headmaster', 'dos') and student.school_id != current_user.school_id:
        return jsonify({'error': 'Not authorized'}), 403
    elif current_user.role == 'sector_leader':
        from ..models.school import School
        school = School.query.filter_by(id=student.school_id, created_by_id=current_user.id).first()
        if not school:
            return jsonify({'error': 'Not authorized'}), 403
    return jsonify(student.to_dict()), 200


@students_bp.route('/<int:student_id>', methods=['PUT'])
@jwt_required()
def update_student(student_id):
    current_user = get_current_user()
    if current_user.role not in ('dos', 'headmaster', 'teacher'):
        return jsonify({'error': 'Not authorized'}), 403

    student = Student.query.get_or_404(student_id)
    if current_user.role == 'teacher':
        from ..models.school import Class
        cls = Class.query.filter_by(teacher_id=current_user.id).first()
        if not cls or student.class_id != cls.id:
            return jsonify({'error': 'Not authorized'}), 403
    elif current_user.role in ('headmaster', 'dos') and student.school_id != current_user.school_id:
        return jsonify({'error': 'Not authorized'}), 403

    data = request.get_json()
    if 'name' in data:
        student.name = data['name']
    if 'guardian' in data:
        student.guardian = data['guardian']
    if 'village' in data:
        student.village = data['village']
    if 'gender' in data:
        student.gender = data['gender']
    if 'student_id' in data:
        existing = Student.query.filter(Student.student_id == data['student_id'], Student.id != student.id).first()
        if existing:
            return jsonify({'error': 'Student ID already exists'}), 409
        student.student_id = data['student_id']

    db.session.commit()
    return jsonify(student.to_dict()), 200


@students_bp.route('/replace-class/<int:class_id>', methods=['POST'])
@jwt_required()
def replace_class_students(class_id):

    current_user = get_current_user()

    if current_user.role not in ('dos', 'headmaster'):
        return jsonify({'error': 'Only DOS or headmaster can replace student lists'}), 403

    from ..models.school import Class
    cls = Class.query.get_or_404(class_id)
    if cls.school_id != current_user.school_id:
        return jsonify({'error': 'Not authorized'}), 403

    data = request.get_json()
    students_data = data.get('students', [])

    # Deactivate all current students in the class
    Student.query.filter_by(class_id=class_id).update({'is_active': False})

    # Add new students
    created = 0
    for s in students_data:
        student_id = s.get('student_id', '').strip()
        name = s.get('name', '').strip()
        if not student_id or not name:
            continue
        # Check if student_id exists in school (maybe inactive)
        existing = Student.query.filter_by(student_id=student_id, school_id=current_user.school_id).first()
        if existing:
            existing.name = name
            existing.guardian = s.get('guardian', '')
            existing.village = s.get('village', '')
            existing.gender = s.get('gender', '')
            existing.class_id = class_id
            existing.is_active = True
        else:
            db.session.add(Student(
                student_id=student_id,
                name=name,
                guardian=s.get('guardian', ''),
                village=s.get('village', ''),
                gender=s.get('gender', ''),
                school_id=current_user.school_id,
                class_id=class_id,
                is_active=True
            ))
        created += 1

    db.session.commit()
    return jsonify({'message': f'Replaced with {created} students', 'class': cls.to_dict()}), 200
