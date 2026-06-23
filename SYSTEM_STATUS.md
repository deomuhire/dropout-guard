DropoutGuard System - Setup & Verification Checklist
================================================

## Database Status
✅ **NO CHANGES NEEDED** - The database schema is COMPLETE and properly defined.

### Current Schema (from migration 8aaa7b894aed_initial.py):

**users** table
- id, username (unique), email (unique), password_hash, role
- Location fields: province, district, sector, village
- school_id (FK to schools)
- created_by_id (FK to users) - tracks who created this user
- created_at, is_active
- ✅ Supports all 5 roles: superadmin, sector_leader, headmaster, dos, teacher

**schools** table
- id, name, province, district, sector, village
- headmaster_name, headmaster_email
- created_by_id (FK to users) - sector_leader who created it
- created_at, is_active
- ✅ Complete location hierarchy for Rwanda

**students** table
- id, student_id (unique), name, guardian, village, gender
- school_id (FK to schools), class_id (FK to classes)
- created_at, is_active

**classes** table
- id, name (e.g., "S3 A", "P6 B"), school_id (FK to schools)
- teacher_id (FK to users) - DOS assigns teacher to class

**attendance** table
- id, student_id, date
- ✅ All 15 risk factor fields:
  - Categorical: age_group, gender, performance, year_of_study, social_activity
  - Binary: lack_of_school_material, lack_of_school_fees, job_opportunity, pregnancy,
    family_conflicts, drug_abuse, lack_of_motivation, illness, absenteeism, bad_discipline
- at_risk (bool), risk_probability (float %)
- recorded_by_id (FK to users) - which teacher filled this
- created_at, updated_at

---

## Backend Status

### API Endpoints ✅ ALL IMPLEMENTED

**Auth**
- POST /api/auth/login → { username, password } → { token, user }
- GET /api/auth/me → current user profile
- PUT /api/auth/change-password → change password

**Users (role-based hierarchy)**
- GET /api/users/ → list created users
- POST /api/users/ → create role-specific users (server enforces hierarchy)
- PUT /api/users/{id} → edit user (name, email, location, password)
- PUT /api/users/{id}/toggle → activate/deactivate user

**Schools**
- GET /api/schools/ → list schools (role-filtered)
- POST /api/schools/ → create school (sector_leader only)
- PUT /api/schools/{id} → edit school
- GET /api/schools/{id}/classes → list classes in school
- POST /api/schools/{id}/classes → create class
- PUT /api/schools/classes/{id}/assign-teacher → assign teacher to class

**Students**
- GET /api/students/ → list students (role-filtered)
- POST /api/students/ → create student
- GET /api/students/{id} → get student profile

**Attendance (with ML prediction)**
- POST /api/attendance/student/{id} → save form → triggers ML predict → returns {at_risk, risk_probability}
- GET /api/attendance/student/{id} → pre-fill today's form
- GET /api/attendance/school/{id}/summary → KPIs for school today
- GET /api/attendance/class/{id}/today → today's class records

**Reports**
- GET /api/reports/school/{id} → list available reports (dates)
- GET /api/reports/school/{id}/download?date=YYYY-MM-DD → download PDF
- GET /api/reports/sector/{id} → sector leader sees all schools' reports

### ML Model ✅ READY
- Path: app/ml/predictor.py
- Loads trained model from: app/ml/model.pkl
- Encodes all 15 fields correctly
- Returns: { at_risk (bool), risk_probability (float %) }

---

## Frontend Status ✅ ALL IMPLEMENTED

### Pages
- **Login.jsx** → username + password
- **Dashboard.jsx** → role-specific views with correct KPIs
- **UserManagement.jsx** → create/edit users with cascading location dropdowns
- **StudentForm.jsx** → all 15 dropdown fields → ML prediction display
- **Reports.jsx** → list reports → download as PDF

### Features per Role

**Super Admin Dashboard**
- Total sector leaders, active/inactive counts
- Table of all sector leaders
- Create sector leader button

**Sector Leader Dashboard**
- Total schools, headmasters count, at-risk students today
- School table (name, location, recorded, at risk, safe, avg risk %)
- Headmaster table with status

**Headmaster/DOS Dashboard**
- School KPIs: recorded today, at risk, safe, avg risk %
- Risk by performance level (bar chart)
- Risk distribution (pie chart)
- DOS/Teachers table with status
- Student records table for today

**Teacher Dashboard**
- My class students count (total, at risk, safe)
- Fill Form button for each student
- Form has all 15 dropdowns
- Instant prediction display

---

## Initial Setup Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Initialize Database
```bash
flask db upgrade
```

### 3. Create Superadmin
```bash
python seed.py
```
Output: Superadmin created with username: `admin`, password: `admin`

### 4. Start Backend
```bash
python run.py
```
Runs on http://localhost:5000

### 5. Start Frontend
```bash
cd frontend
npm install  # (if needed)
npm run dev
```
Runs on http://localhost:3002 (or next available port)

---

## User Creation Hierarchy (Verified)

superadmin
└── creates sector_leader (with location: province, district, sector, village)
    └── creates school (name, location, headmaster name/email)
    └── creates headmaster (for that school)
        └── creates dos (Director of Studies)
            └── creates teacher
                └── creates class (S3 A, P6 B, etc.)
                └── fills student daily forms (15 fields)
                    └── ML model predicts: At Risk ⚠ or Safe ✓

---

## System Flow (Daily)

1. Teacher logs in
2. Sees their class students (only those assigned)
3. Clicks "Fill Form" for each student
4. Fills 15 dropdown fields (no typing numbers)
5. Clicks Save
6. System runs ML predict → shows result instantly
7. Data saved to database
8. Next day: form pre-filled, teacher only updates what changed
9. Reports automatically available for download

---

## Critical Files

Backend:
- app/__init__.py → app factory
- app/models/*.py → all 5 data models ✅
- app/routes/*.py → all API endpoints ✅
- app/ml/predictor.py → ML prediction with encoding ✅
- migrations/versions/8aaa7b894aed_initial.py → complete schema ✅
- seed.py → initialize superadmin (NEW) ✅

Frontend:
- src/pages/Dashboard.jsx → role-specific views ✅
- src/pages/UserManagement.jsx → cascading location dropdowns ✅
- src/pages/StudentForm.jsx → 15 dropdown fields ✅
- src/pages/Reports.jsx → PDF download ✅
- src/context/AuthContext.jsx → user auth state ✅

---

## Status Summary

✅ Database: Complete, no migrations needed
✅ Backend: All 5 roles, all endpoints, ML integrated
✅ Frontend: All pages, all forms, role-specific views
✅ User hierarchy: Verified top-to-bottom
✅ ML prediction: Integrated in attendance save
✅ Reports: Auto-saved, downloadable as PDF

🚀 System is READY TO RUN
