# Dropout Risk Prediction System

## Project Structure
```
dropout-system/
├── backend/          ← Flask API + ML model
└── frontend/         ← React UI
```

---

## IMPORTANT: Add your model.pkl

Copy your trained Random Forest model file into:
```
backend/app/ml/model.pkl
```

To export it from your notebook, add this cell and run it:
```python
import joblib
joblib.dump(rf_model, 'model.pkl')  # replace rf_model with your variable name
```

---

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

### Configure .env
Edit `backend/.env` and fill in your Vercel PostgreSQL credentials:
```
DATABASE_URL=postgresql://username:password@host/dropout_db
JWT_SECRET_KEY=your-long-random-secret
```

### Run migrations & start
```bash
flask db init
flask db migrate -m "initial"
flask db upgrade

# Create superadmin (run once)
python seed.py

python run.py
```
Backend runs at: http://localhost:5000

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:3000

---

## User Roles
| Role          | Created by    | Can do                              |
|---------------|---------------|-------------------------------------|
| superadmin    | (you/seeded)  | Create sector leaders, see all data |
| sector_leader | superadmin    | Create schools + headmasters        |
| headmaster    | sector_leader | Create DOS, see whole school        |
| dos           | headmaster    | Create teachers, assign classes     |
| teacher       | dos           | Fill student forms, see their class |

## API Endpoints
- POST /api/auth/login
- GET  /api/auth/me
- GET/POST /api/users/
- GET/POST /api/schools/
- GET/POST /api/students/
- GET/POST /api/attendance/student/:id
- GET /api/reports/school/:id
- GET /api/reports/school/:id/download?date=YYYY-MM-DD
