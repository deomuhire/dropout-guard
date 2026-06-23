from app import create_app, db
from app.models.user import User
from app.models.school import School
from app.models.student import Student
from app.models.attendance import Attendance

app = create_app()

# Auto-create tables and seed superadmin on startup
with app.app_context():
    db.create_all()
    print("✅ Database tables created")
    
    # Create superadmin if not exists
    existing = User.query.filter_by(role='superadmin').first()
    if not existing:
        superadmin = User(
            username='admin1',
            email='admin@dropoutguard.rw',
            role='superadmin',
            first_name='Super',
            last_name='Admin',
            must_change_password=False,
            is_active=True
        )
        superadmin.set_password('admin2026!')
        db.session.add(superadmin)
        db.session.commit()
        print("✅ Superadmin created!")
    else:
        print("✅ Superadmin already exists")

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'School': School,
        'Student': Student,
        'Attendance': Attendance
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)