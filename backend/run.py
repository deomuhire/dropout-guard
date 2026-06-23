import time
from app import create_app, db
from app.models.user import User
from app.models.school import School
from app.models.student import Student
from app.models.attendance import Attendance

app = create_app()

def init_db():
    max_retries = 5
    for attempt in range(max_retries):
        try:
            with app.app_context():
                db.create_all()
                print("✅ Database tables created")
                
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
            return True
        except Exception as e:
            print(f"⚠️ Database initialization attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                print("❌ Database initialization failed after retries")
                raise

init_db()

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