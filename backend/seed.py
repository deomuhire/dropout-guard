#!/usr/bin/env python
"""
Seed script to initialize the database with a superadmin user.
Run this once at the very beginning to set up your system admin account.
"""

from app import create_app, db
from app.models.user import User

def seed():
    app = create_app()
    with app.app_context():
        # Check if superadmin already exists
        existing = User.query.filter_by(role='superadmin').first()
        if existing:
            print(f"✅ Superadmin already exists: {existing.username}")
            return

        # Create superadmin
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
        
        print("✅ Superadmin created successfully!")
        print(f"   Username: {superadmin.username}")
        print(f"   Password: admin2026!")
        print(f"   Role: superadmin")
        print(f"   Email: {superadmin.email}")

if __name__ == '__main__':
    seed()
