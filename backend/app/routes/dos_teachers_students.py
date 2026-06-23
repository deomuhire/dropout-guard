from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from .. import db
from ..models.student import Student
from ..models.user import User
from ..utils.auth import get_current_user

students_for_teachers_bp = Blueprint('dos_teachers_students', __name__)


def _get_teacher_class(teacher_id: int):
    """Return (cls, teacher_user).

    Primary lookup uses Class.teacher_id.
    Fallback supports deployments where teacher->class mapping isn't queryable via Class.teacher_id,
    by using teacher.assigned_class (if present on the User model serializer).
    """
    from ..models.school import Class

    cls = Class.query.filter_by(teacher_id=teacher_id).first()
    teacher_user = User.query.filter_by(id=teacher_id, role='teacher').first()

    if cls is not None:
        return cls, teacher_user

    # Fallback: try to resolve from assigned_class payload on teacher serializer.
    if teacher_user is not None:
        teacher_dict = teacher_user.to_dict() if hasattr(teacher_user, 'to_dict') else {}
        assigned = teacher_dict.get('assigned_class')
        assigned_id = assigned.get('id') if assigned else None
        if assigned_id:
            cls_fallback = Class.query.filter_by(id=assigned_id).first()
            if cls_fallback:
                return cls_fallback, teacher_user

    return None, teacher_user


def _teacher_class_authorized_for_dos(current_user, cls, teacher_user):
    if not cls or not teacher_user:
        return False

    if current_user.role in ('dos', 'headmaster'):
        return cls.school_id == current_user.school_id

    if current_user.role == 'superadmin':
        # superadmin can only within their hierarchy; rely on cls.school.created_by_id
        from ..models.school import School

        school = School.query.filter_by(id=cls.school_id).first()
        if not school:
            return False
        return school.created_by_id is not None

    return False


@students_for_teachers_bp.route('/dos/<int:dos_id>/teachers-with-students', methods=['GET'])
@jwt_required()
def dos_teachers_with_students(dos_id: int):
    """Return all teacher users created by this DOS along with their assigned class students."""
    current_user = get_current_user()

    if current_user.role not in ('dos', 'headmaster', 'superadmin'):
        return jsonify({'error': 'Not authorized'}), 403

    if current_user.role == 'dos' and current_user.id != dos_id:
        return jsonify({'error': 'Not authorized'}), 403

    from ..models.school import Class

    teachers = User.query.filter_by(created_by_id=dos_id, role='teacher').all()

    # Scope enforcement helper for fallbacks
    dos_school_id = current_user.school_id if current_user.role in ('dos', 'headmaster') else None

    teachers_payload = []

    for t in teachers:
        # Strategy:
        #   1) Prefer Class.teacher_id lookup
        #   2) Fallback to teacher.to_dict().assigned_class
        #   3) Last resort: try any Class for this teacher in the DOS's scoped school

        cls = Class.query.filter_by(teacher_id=t.id).first()
        if current_user.role in ('dos', 'headmaster') and cls is not None:
            if not _teacher_class_authorized_for_dos(current_user, cls, t):
                cls = None

        assigned_class_payload = None
        students = []

        if cls is not None:
            assigned_class_payload = cls.to_dict_basic()
            students = cls.students.filter_by(is_active=True).all()
        else:
            # Fallback 1
            teacher_dict = t.to_dict() if hasattr(t, 'to_dict') else {}
            assigned = teacher_dict.get('assigned_class')
            assigned_id = assigned.get('id') if assigned else None

            if assigned_id:
                cls_fallback = Class.query.filter_by(id=assigned_id).first()
                if cls_fallback and _teacher_class_authorized_for_dos(current_user, cls_fallback, t):
                    assigned_class_payload = cls_fallback.to_dict_basic()
                    students = cls_fallback.students.filter_by(is_active=True).all()

            # Fallback 2
            if assigned_class_payload is None and dos_school_id is not None:
                cls_school = Class.query.filter_by(teacher_id=t.id, school_id=dos_school_id).first()
                if cls_school and _teacher_class_authorized_for_dos(current_user, cls_school, t):
                    assigned_class_payload = cls_school.to_dict_basic()
                    students = cls_school.students.filter_by(is_active=True).all()

        teachers_payload.append({
            'teacher': t.to_dict(),
            'assigned_class': assigned_class_payload,
            'students': [s.to_dict() for s in students],
        })

    return jsonify({'teachers': teachers_payload}), 200


@students_for_teachers_bp.route('/<int:teacher_id>/students', methods=['GET'])
@jwt_required()
def list_students_for_teacher(teacher_id: int):
    current_user = get_current_user()

    if current_user.role not in ('dos', 'headmaster', 'superadmin'):
        return jsonify({'error': 'Not authorized'}), 403

    cls, teacher_user = _get_teacher_class(teacher_id)
    if not _teacher_class_authorized_for_dos(current_user, cls, teacher_user):
        return jsonify({'error': 'Not authorized'}), 403

    if not cls:
        return jsonify([]), 200

    students = cls.students.filter_by(is_active=True).all()
    return jsonify([s.to_dict() for s in students]), 200


@students_for_teachers_bp.route('/<int:teacher_id>/students/add', methods=['POST'])
@jwt_required()
def add_student_for_teacher(teacher_id: int):
    current_user = get_current_user()

    if current_user.role not in ('dos', 'headmaster', 'superadmin'):
        return jsonify({'error': 'Not authorized'}), 403

    cls, teacher_user = _get_teacher_class(teacher_id)
    if not _teacher_class_authorized_for_dos(current_user, cls, teacher_user):
        return jsonify({'error': 'Not authorized'}), 403

    if not cls:
        return jsonify({'error': 'Teacher class not found'}), 404

    data = request.get_json() or {}
    student_id = (data.get('student_id') or '').strip()
    name = (data.get('name') or '').strip()

    if not student_id or not name:
        return jsonify({'error': 'student_id and name are required'}), 400

    if Student.query.filter_by(student_id=student_id).first():
        return jsonify({'error': 'Student ID already exists'}), 409

    student = Student(
        student_id=student_id,
        name=name,
        guardian=(data.get('guardian') or ''),
        village=(data.get('village') or ''),
        gender=(data.get('gender') or ''),
        school_id=cls.school_id,
        class_id=cls.id,
        is_active=True,
    )
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


@students_for_teachers_bp.route('/<int:teacher_id>/students/<int:student_id>', methods=['DELETE'])
@jwt_required()
def delete_student_for_teacher(teacher_id: int, student_id: int):
    current_user = get_current_user()

    if current_user.role not in ('dos', 'headmaster', 'superadmin'):
        return jsonify({'error': 'Not authorized'}), 403

    cls, teacher_user = _get_teacher_class(teacher_id)
    if not _teacher_class_authorized_for_dos(current_user, cls, teacher_user):
        return jsonify({'error': 'Not authorized'}), 403

    if not cls:
        return jsonify({'error': 'Teacher class not found'}), 404

    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    if student.class_id != cls.id or student.school_id != cls.school_id:
        return jsonify({'error': 'Not authorized'}), 403

    student.is_active = False
    db.session.commit()
    return jsonify({'message': 'Student deleted'}), 200


@students_for_teachers_bp.route('/dos/<int:dos_id>/students', methods=['GET'])
@jwt_required()
def list_students_for_dos(dos_id: int):
    """Return all active students visible to this DOS (flat list)."""
    current_user = get_current_user()

    if current_user.role not in ('dos', 'headmaster', 'superadmin'):
        return jsonify({'error': 'Not authorized'}), 403

    if current_user.role == 'dos' and current_user.id != dos_id:
        return jsonify({'error': 'Not authorized'}), 403

    dos_user = User.query.filter_by(id=dos_id, role='dos').first()
    if not dos_user or not dos_user.school_id:
        return jsonify({'error': 'DOS not found or not assigned to a school'}), 404

    if current_user.role in ('headmaster', 'dos') and dos_user.school_id != current_user.school_id:
        return jsonify({'error': 'Not authorized'}), 403

    students = Student.query.filter_by(school_id=dos_user.school_id, is_active=True).all()
    return jsonify([s.to_dict() for s in students]), 200

