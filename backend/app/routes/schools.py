from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from .. import db
from ..models.school import School, Class
from ..models.user import User
from ..utils.auth import get_current_user

schools_bp = Blueprint('schools', __name__)

@schools_bp.route('/', methods=['GET'])
@jwt_required()
def list_schools():
    current_user = get_current_user()

    if current_user.role == 'superadmin':
        # Superadmin can optionally filter by leader_id query param
        leader_id = request.args.get('leader_id', type=int)
        if leader_id:
            leader = User.query.filter_by(id=leader_id, created_by_id=current_user.id, role='sector_leader').first()
            if not leader:
                return jsonify({'error': 'Sector leader not found'}), 404
            schools = School.query.filter_by(created_by_id=leader_id).all()
        else:
            schools = School.query.all()
    elif current_user.role == 'sector_leader':
        schools = School.query.filter_by(created_by_id=current_user.id).all()
    elif current_user.role in ('headmaster', 'dos', 'teacher'):
        schools = School.query.filter_by(id=current_user.school_id).all()
    else:
        schools = []

    return jsonify([s.to_dict() for s in schools]), 200


@schools_bp.route('/', methods=['POST'])
@jwt_required()
def create_school():
    current_user = get_current_user()
    if current_user.role != 'sector_leader':
        return jsonify({'error': 'Only sector leaders can create schools'}), 403

    data = request.get_json()
    school = School(
        name             = data['name'],
        province         = data.get('province') or current_user.province,
        district         = data.get('district') or current_user.district,
        sector           = data.get('sector') or current_user.sector,
        village          = data.get('village', ''),
        headmaster_name  = data.get('headmaster_name', ''),
        headmaster_email = data.get('headmaster_email', ''),
        created_by_id    = current_user.id
    )
    db.session.add(school)
    db.session.commit()
    return jsonify(school.to_dict()), 201


@schools_bp.route('/<int:school_id>', methods=['PUT'])
@jwt_required()
def update_school(school_id):
    current_user = get_current_user()
    school = School.query.get_or_404(school_id)

    if school.created_by_id != current_user.id and current_user.role != 'superadmin':
        return jsonify({'error': 'Not authorized'}), 403

    data = request.get_json()
    for field in ['name', 'province', 'district', 'sector', 'village',
                  'headmaster_name', 'headmaster_email']:
        if field in data:
            setattr(school, field, data[field])

    db.session.commit()
    return jsonify(school.to_dict()), 200


# ── Classes ──────────────────────────────────────────────────────────────────

@schools_bp.route('/<int:school_id>/classes', methods=['GET'])
@jwt_required()
def list_classes(school_id):
    current_user = get_current_user()
    school = School.query.get_or_404(school_id)
    if current_user.role == 'sector_leader' and school.created_by_id != current_user.id:
        return jsonify({'error': 'Not authorized'}), 403
    if current_user.role in ('headmaster', 'dos', 'teacher') and current_user.school_id != school_id:
        return jsonify({'error': 'Not authorized'}), 403
    classes = Class.query.filter_by(school_id=school_id).all()
    return jsonify([c.to_dict() for c in classes]), 200


@schools_bp.route('/<int:school_id>/classes', methods=['POST'])
@jwt_required()
def create_class(school_id):
    current_user = get_current_user()
    if current_user.role != 'dos':
        return jsonify({'error': 'Only DOS can create classes'}), 403
    if current_user.school_id != school_id:
        return jsonify({'error': 'Not authorized for this school'}), 403

    data = request.get_json()
    teacher_id = data.get('teacher_id')
    if teacher_id:
        from ..models.user import User
        teacher = User.query.filter_by(
            id=teacher_id,
            role='teacher',
            school_id=school_id,
            created_by_id=current_user.id,
            is_active=True
        ).first()
        if not teacher:
            return jsonify({'error': 'Teacher not found in your school'}), 404
    cls = Class(
        name       = data['name'],
        school_id  = school_id,
        teacher_id = teacher_id
    )
    db.session.add(cls)
    db.session.commit()
    return jsonify(cls.to_dict()), 201


@schools_bp.route('/classes/<int:class_id>/assign-teacher', methods=['PUT'])
@jwt_required()
def assign_teacher(class_id):
    current_user = get_current_user()
    if current_user.role != 'dos':
        return jsonify({'error': 'Only DOS can assign teachers'}), 403

    data = request.get_json()
    cls = Class.query.get_or_404(class_id)
    if cls.school_id != current_user.school_id:
        return jsonify({'error': 'Not authorized for this class'}), 403
    from ..models.user import User
    teacher = User.query.filter_by(
        id=data['teacher_id'],
        role='teacher',
        school_id=current_user.school_id,
        created_by_id=current_user.id,
        is_active=True
    ).first()
    if not teacher:
        return jsonify({'error': 'Teacher not found in your school'}), 404
    cls.teacher_id = data['teacher_id']
    db.session.commit()
    return jsonify(cls.to_dict()), 200


@schools_bp.route('/classes/<int:class_id>/students', methods=['GET'])
@jwt_required()
def get_class_students(class_id):
    current_user = get_current_user()
    cls = Class.query.get_or_404(class_id)
    # Only allow DOS/headmaster of the same school or the assigned teacher
    if current_user.role == 'dos' or current_user.role == 'headmaster':
        if cls.school_id != current_user.school_id:
            return jsonify({'error': 'Not authorized'}), 403
    elif current_user.role == 'teacher':
        if cls.teacher_id != current_user.id:
            return jsonify({'error': 'Not authorized'}), 403
    else:
        return jsonify({'error': 'Not authorized'}), 403
    students = cls.students.filter_by(is_active=True).all()
    return jsonify([s.to_dict() for s in students]), 200
