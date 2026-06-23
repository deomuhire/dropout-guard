#!/usr/bin/env python
"""
Reset the database to a clean DropoutGuard starting point.

This deletes all application data, restarts IDs, and creates only the
superadmin account:
  username: admin
  password: admin
"""

from sqlalchemy import text

from app import create_app, db
from app.models.attendance import Attendance
from app.models.school import Class, School
from app.models.student import Student
from app.models.user import User

ALEMBIC_HEAD = '2b1c6d9f4a21'


def create_superadmin():
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
    return superadmin


def reset():
    app = create_app()
    with app.app_context():
        # Drop everything in the public schema so partial/dirty migrations do not survive.
        db.session.execute(text('DROP SCHEMA public CASCADE'))
        db.session.execute(text('CREATE SCHEMA public'))
        db.session.commit()

        db.create_all()
        db.session.execute(text('CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)'))
        db.session.execute(
            text('INSERT INTO alembic_version (version_num) VALUES (:version)'),
            {'version': ALEMBIC_HEAD}
        )
        db.session.commit()

        superadmin = create_superadmin()
        print('Database reset successfully.')
        print(f'Username: {superadmin.username}')
        print('Password: admin2026!')


if __name__ == '__main__':
    reset()
