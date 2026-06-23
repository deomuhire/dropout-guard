from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from .. import db
from ..models.user import User
from ..models.school import School, Class
from ..utils.auth import get_current_user, validate_password

users_bp = Blueprint('users', __name__)

ROLE_CAN_CREATE = {
    'superadmin':    'sector_leader',
    'sector_leader': 'headmaster',
    'headmaster':    'dos',
    'dos':           'teacher',
}

PRIMARY_CLASSES = {'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P6A'}

def normalize_phone(value):
    phone = ''.join(ch for ch in (value or '') if ch.isdigit())
    if not phone:
        return ''
    if len(phone) != 10 or not phone.startswith('07'):
        raise ValueError('Phone must be 10 digits and start with 07')
    return phone

@users_bp.route('/', methods=['GET'])
@jwt_required()
def list_users():
    current_user = get_current_user()
    if current_user.role == 'superadmin':
        users = User.query.filter_by(created_by_id=current_user.id, role='sector_leader').all()
    else:
        users = User.query.filter_by(created_by_id=current_user.id).all()
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.route('/hierarchy', methods=['GET'])
@jwt_required()
def list_hierarchy_users():
    """Headmaster: list all DOS users under the headmaster and all their teachers."""
    current_user = get_current_user()
    if current_user.role != 'headmaster':
        return jsonify({'error': 'Only headmaster can view hierarchy'}), 403

    # DOS users created by this headmaster
    dos_users = User.query.filter_by(created_by_id=current_user.id, role='dos').all()
    all_users = []

    # Keep ordering: DOS then teachers
    for dos in dos_users:
        all_users.append(dos)
        teachers = User.query.filter_by(created_by_id=dos.id, role='teacher').all()
        all_users.extend(teachers)

    # Ensure full payload (including assigned_class for teacher via User.to_dict)
    return jsonify({'users': [u.to_dict() for u in all_users]}), 200



@users_bp.route('/sector/<int:leader_id>', methods=['GET'])
@jwt_required()
def list_sector_users(leader_id):
    """Superadmin: list all users under a specific sector leader."""
    current_user = get_current_user()
    if current_user.role != 'superadmin':
        return jsonify({'error': 'Only superadmin can view sector details'}), 403
    # Verify the leader belongs to this superadmin
    leader = User.query.filter_by(id=leader_id, created_by_id=current_user.id, role='sector_leader').first()
    if not leader:
        return jsonify({'error': 'Sector leader not found'}), 404
    # Get headmasters created by this leader
    headmasters = User.query.filter_by(created_by_id=leader_id, role='headmaster').all()
    # Get DOS and teachers under each headmaster
    all_users = list(headmasters)
    for hm in headmasters:
        dos_list = User.query.filter_by(created_by_id=hm.id, role='dos').all()
        all_users.extend(dos_list)
        for dos in dos_list:
            teachers = User.query.filter_by(created_by_id=dos.id, role='teacher').all()
            all_users.extend(teachers)
    return jsonify({'leader': leader.to_dict(), 'users': [u.to_dict() for u in all_users]}), 200


@users_bp.route('/', methods=['POST'])
@jwt_required()
def create_user():
    current_user = get_current_user()
    data = request.get_json()

    new_role = ROLE_CAN_CREATE.get(current_user.role)
    if not new_role:
        return jsonify({'error': 'You cannot create users'}), 403

    if not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'error': 'Username, email and password are required'}), 400

    is_valid, criteria = validate_password(data['password'])
    if not is_valid:
        return jsonify({'error': 'Password does not meet strength requirements', 'criteria': criteria}), 400
    try:
        phone = normalize_phone(data.get('phone'))
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    school_id = current_user.school_id if new_role in ('dos', 'teacher') else None

    if new_role == 'sector_leader':
        for field in ('province', 'district', 'sector'):
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        # Check if an active sector leader already exists for this sector location
        existing_leader = User.query.filter_by(
            province=data.get('province'),
            district=data.get('district'),
            sector=data.get('sector'),
            role='sector_leader',
            is_active=True
        ).first()
        if existing_leader:
            return jsonify({'error': f'A Sector Leader ({existing_leader.first_name} {existing_leader.last_name}) already exists for {data.get("sector")}, {data.get("district")}, {data.get("province")}'}), 409

    # Sector leaders create/find a school before assigning a headmaster.
    if new_role == 'headmaster':
        if not data.get('school_name') and not data.get('school_id'):
            return jsonify({'error': 'School name or school_id is required for a headmaster'}), 400
        if data.get('school_id'):
            school = School.query.filter_by(
                id=data['school_id'],
                created_by_id=current_user.id,
                is_active=True
            ).first()
            if not school:
                return jsonify({'error': 'School not found in your sector'}), 404
            # Check if this school already has an active headmaster
            existing_hm = User.query.filter_by(school_id=school.id, role='headmaster', is_active=True).first()
            if existing_hm:
                return jsonify({'error': f'This school already has a headmaster ({existing_hm.first_name} {existing_hm.last_name})'}), 409
            school_id = school.id
            data['province'] = school.province
            data['district'] = school.district
            data['sector'] = school.sector
            data['village'] = school.village or data.get('village', '')
        else:
            province = data.get('province') or current_user.province
            district = data.get('district') or current_user.district
            sector = data.get('sector') or current_user.sector
            if not province or not district or not sector:
                return jsonify({'error': 'Unable to determine location for school creation'}), 400
            data['province'], data['district'], data['sector'] = province, district, sector

            school_name = data['school_name'].strip()
            school = School.query.filter_by(
                name=school_name,
                province=data.get('province'),
                district=data.get('district'),
                sector=data.get('sector'),
                created_by_id=current_user.id
            ).first()
            if school:
                # School already exists — check if it already has a headmaster
                existing_hm = User.query.filter_by(school_id=school.id, role='headmaster', is_active=True).first()
                if existing_hm:
                    return jsonify({'error': f'School "{school_name}" already exists and has a headmaster ({existing_hm.first_name} {existing_hm.last_name})'}), 409
            else:
                school = School(
                    name=school_name,
                    province=data.get('province'),
                    district=data.get('district'),
                    sector=data.get('sector'),
                    village=data.get('village'),
                    headmaster_name=f"{data.get('first_name', '').strip()} {data.get('last_name', '').strip()}".strip(),
                    headmaster_email=data.get('email', '').strip(),
                    created_by_id=current_user.id
                )
                db.session.add(school)
                db.session.flush()
            school_id = school.id

    if new_role in ('dos', 'teacher') and not school_id:
        return jsonify({'error': 'Your account is not assigned to a school'}), 400

    if new_role == 'teacher':
        class_name = (data.get('class_name') or '').strip().upper()
        if not class_name:
            return jsonify({'error': 'Class is required for a teacher'}), 400
        if class_name not in PRIMARY_CLASSES:
            return jsonify({'error': 'Class must be one of P1, P2, P3, P4, P5, P6 or P6A'}), 400
        # Check if class already has a different active teacher assigned
        existing_class = Class.query.filter_by(name=class_name, school_id=school_id).first()
        if existing_class and existing_class.teacher_id:
            existing_teacher = User.query.filter_by(id=existing_class.teacher_id, is_active=True).first()
            if existing_teacher:
                return jsonify({'error': f'Class {class_name} is already assigned to {existing_teacher.first_name} {existing_teacher.last_name}'}), 409

    # Check if school already has an active headmaster
    if new_role == 'headmaster' and school_id:
        existing_hm = User.query.filter_by(school_id=school_id, role='headmaster', is_active=True).first()
        if existing_hm:
            return jsonify({'error': f'This school already has a headmaster ({existing_hm.first_name} {existing_hm.last_name})'}), 409

    # Check if school already has an active DOS
    if new_role == 'dos' and school_id:
        existing_dos = User.query.filter_by(school_id=school_id, role='dos', is_active=True).first()
        if existing_dos:
            return jsonify({'error': f'This school already has a DOS ({existing_dos.first_name} {existing_dos.last_name})'}), 409

    user = User(
        username      = data['username'].strip(),
        email         = data['email'].strip(),
        phone         = phone,
        role          = new_role,
        first_name    = data.get('first_name', '').strip(),
        last_name     = data.get('last_name', '').strip(),
        province      = (data.get('province') or current_user.province or '').strip(),
        district      = (data.get('district') or current_user.district or '').strip(),
        sector        = (data.get('sector') or current_user.sector or '').strip(),
        village       = data.get('village', '').strip(),
        school_id     = school_id,
        created_by_id = current_user.id,
        must_change_password = True
    )
    user.set_password(data['password'])

    try:
        db.session.add(user)
        db.session.flush()

        if new_role == 'teacher':
            class_name = (data.get('class_name') or '').strip().upper()
            cls = Class.query.filter_by(name=class_name, school_id=school_id).first()
            if not cls:
                cls = Class(name=class_name, school_id=school_id)
                db.session.add(cls)
                db.session.flush()
            cls.teacher_id = user.id

        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"ERROR CREATING USER: {str(e)}")
        return jsonify({'error': str(e)}), 500


@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user = get_current_user()
    user = User.query.get_or_404(user_id)
    
    # Check authorization: direct creator OR superadmin in the hierarchy
    authorized = user.created_by_id == current_user.id
    if not authorized and current_user.role == 'superadmin':
        # Check if user is in superadmin's hierarchy (sector leader -> headmaster -> dos -> teacher)
        if user.role == 'sector_leader' and user.created_by_id == current_user.id:
            authorized = True
        elif user.role == 'headmaster':
            leader = User.query.filter_by(id=user.created_by_id, role='sector_leader', created_by_id=current_user.id).first()
            if leader:
                authorized = True
        elif user.role == 'dos':
            hm = User.query.filter_by(id=user.created_by_id, role='headmaster').first()
            if hm:
                leader = User.query.filter_by(id=hm.created_by_id, role='sector_leader', created_by_id=current_user.id).first()
                if leader:
                    authorized = True
        elif user.role == 'teacher':
            dos = User.query.filter_by(id=user.created_by_id, role='dos').first()
            if dos:
                hm = User.query.filter_by(id=dos.created_by_id, role='headmaster').first()
                if hm:
                    leader = User.query.filter_by(id=hm.created_by_id, role='sector_leader', created_by_id=current_user.id).first()
                    if leader:
                        authorized = True
    
    if not authorized:
        return jsonify({'error': 'Not authorized'}), 403
    data = request.get_json()
    if 'username' in data:
        username = data['username'].strip()
        if not username:
            return jsonify({'error': 'Username cannot be empty'}), 400
        existing = User.query.filter(User.username == username, User.id != user.id).first()
        if existing:
            return jsonify({'error': 'Username already exists'}), 409
        user.username = username

    if 'email' in data:
        email = data['email'].strip()
        if not email:
            return jsonify({'error': 'Email cannot be empty'}), 400
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 409
        user.email = email

    if 'phone' in data:
        try:
            phone_val = data.get('phone', '')
            if phone_val and phone_val.strip():
                user.phone = normalize_phone(phone_val)
            else:
                user.phone = ''
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400

    for field in ['first_name','last_name','province','district','sector','village']:
        if field in data:
            setattr(user, field, data[field])
    if data.get('password'):
        is_valid, criteria = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': 'Password does not meet strength requirements', 'criteria': criteria}), 400
        user.set_password(data['password'])

    if user.role == 'teacher' and current_user.role == 'dos' and 'class_name' in data:
        class_name = (data.get('class_name') or '').strip().upper()
        if not class_name:
            return jsonify({'error': 'Class is required for a teacher'}), 400
        if class_name not in PRIMARY_CLASSES:
            return jsonify({'error': 'Class must be one of P1, P2, P3, P4, P5, P6 or P6A'}), 400

        # Check if class is already assigned to a different active teacher
        target_class = Class.query.filter_by(name=class_name, school_id=current_user.school_id).first()
        if target_class and target_class.teacher_id and target_class.teacher_id != user.id:
            existing_teacher = User.query.filter_by(id=target_class.teacher_id, is_active=True).first()
            if existing_teacher:
                return jsonify({'error': f'Class {class_name} is already assigned to {existing_teacher.first_name} {existing_teacher.last_name}'}), 409

        old_class = Class.query.filter_by(teacher_id=user.id).first()
        if old_class and old_class.name != class_name:
            old_class.teacher_id = None

        cls = Class.query.filter_by(name=class_name, school_id=current_user.school_id).first()
        if not cls:
            cls = Class(name=class_name, school_id=current_user.school_id)
            db.session.add(cls)
            db.session.flush()
        cls.teacher_id = user.id
    
    # Handle school update
    if user.role == 'headmaster' and 'school_name' in data:
        school_name = data['school_name'].strip()
        if school_name:
            school = School.query.filter_by(
                name=school_name,
                province=user.province,
                district=user.district,
                sector=user.sector,
                created_by_id=current_user.id
            ).first()
            if not school:
                school = School(
                    name=school_name,
                    province=user.province,
                    district=user.district,
                    sector=user.sector,
                    village=user.village,
                    created_by_id=current_user.id
                )
                db.session.add(school)
                db.session.flush()
            user.school_id = school.id
        else:
            user.school_id = None
    
    db.session.commit()
    return jsonify(user.to_dict()), 200


@users_bp.route('/<int:user_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_user(user_id):
    current_user = get_current_user()
    user = User.query.get_or_404(user_id)
    
    # Check authorization: direct creator OR superadmin in the hierarchy
    authorized = user.created_by_id == current_user.id
    if not authorized and current_user.role == 'superadmin':
        if user.role == 'sector_leader' and user.created_by_id == current_user.id:
            authorized = True
        elif user.role == 'headmaster':
            leader = User.query.filter_by(id=user.created_by_id, role='sector_leader', created_by_id=current_user.id).first()
            if leader:
                authorized = True
        elif user.role == 'dos':
            hm = User.query.filter_by(id=user.created_by_id, role='headmaster').first()
            if hm:
                leader = User.query.filter_by(id=hm.created_by_id, role='sector_leader', created_by_id=current_user.id).first()
                if leader:
                    authorized = True
        elif user.role == 'teacher':
            dos = User.query.filter_by(id=user.created_by_id, role='dos').first()
            if dos:
                hm = User.query.filter_by(id=dos.created_by_id, role='headmaster').first()
                if hm:
                    leader = User.query.filter_by(id=hm.created_by_id, role='sector_leader', created_by_id=current_user.id).first()
                    if leader:
                        authorized = True
    
    if not authorized:
        return jsonify({'error': 'Not authorized'}), 403
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({'is_active': user.is_active}), 200


@users_bp.route('/me/class', methods=['GET'])
@jwt_required()
def get_my_class():
    current_user = get_current_user()
    if current_user.role != 'teacher':
        return jsonify({'error': 'Only teachers can access this'}), 403
    cls = Class.query.filter_by(teacher_id=current_user.id).first()
    if not cls:
        return jsonify({'error': 'No class assigned'}), 404
    return jsonify(cls.to_dict()), 200


@users_bp.route('/me/students', methods=['GET'])
@jwt_required()
def get_my_students():
    current_user = get_current_user()
    if current_user.role != 'teacher':
        return jsonify({'error': 'Only teachers can access this'}), 403
    cls = Class.query.filter_by(teacher_id=current_user.id).first()
    if not cls:
        return jsonify([]), 200
    students = [s.to_dict() for s in cls.students.filter_by(is_active=True).all()]
    return jsonify(students), 200
