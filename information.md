# Information for Use Case Data Flow Diagram (DFD)

This document contains ONLY the information needed to build a **Use Case Data Flow Diagram** for the Dropout Risk Prediction System.

---

## 1) Actors (External Entities)
- **Teacher**: submits daily attendance + 15 risk factors for students in their assigned class.
- **DOS / Headmaster**: views school student lists and KPIs.
- **Sector leader**: views sector-level KPIs/reports across schools.
- **Superadmin**: manages the role hierarchy and system users.
- **Frontend (React app)**: the UI that sends HTTP requests and renders responses.

---

## 2) Processes (What to draw as bubbles)
1. **Authenticate (Login)**
2. **Authorize (Role/Ownership Check)**
3. **Submit Attendance + Risk Factors**
4. **Validate Input**
5. **Persist Attendance Record**
6. **ML Risk Prediction (Inference)**
7. **Compute Derived Fields**
   - `risk_probability`
   - `at_risk` (from threshold rule)
8. **Dashboard KPI Aggregation**
9. **Generate/Download Report (PDF)**

---

## 3) Data Stores (What to draw as cylinder stores)
- **Users**
- **Schools**
- **Classes**
- **Students**
- **Attendance** (per student per date; stores the 15 inputs + derived ML outputs)
- **ML Model Artifact** (trained model file used by inference)

---

## 4) DFD Context-Level Data Flows
**Actors → Frontend → Backend** (HTTP request/response)

**Backend ↔ PostgreSQL DB** (read/write):
- Users/Schools/Classes/Students/Attendance

**Backend → ML Predictor** (during attendance submission):
- input = features derived from form fields
- output = prediction results

Artifacts to label in flows:
- authentication token (JWT)
- attendance input payload
- encoded/feature vector (optional but recommended in detailed DFD)
- prediction outputs
- updated attendance record

---

## 5) Detailed DFD: Attendance Submission + ML Prediction
### Main flow
1. **Teacher → Frontend → Backend**
   - Endpoint: `POST /api/attendance/student/:id`
2. **Backend: Authorize**
   - Teacher can access only students whose `class_id` belongs to the teacher’s assigned class.
3. **Backend: Validate Input**
   - Ensure required fields exist and categorical values are from allowed sets.
4. **Backend: Persist Attendance (write)**
   - Store:
     - all 15 risk factor fields
     - `recorded_by_id` (teacher id)
     - `date` (today)
5. **Backend: ML Risk Prediction (process)**
   - Read **ML Model Artifact**
   - Perform feature encoding consistent with training
   - Run inference to compute `risk_probability`
6. **Backend: Compute Derived Fields**
   - `at_risk` = boolean derived from threshold applied to `risk_probability`
7. **Backend: Persist derived outputs (write)**
   - Update the same Attendance record with `at_risk` + `risk_probability`
8. **Backend → Frontend**
   - Return `{ at_risk, risk_probability }` for immediate UI display.

### Attendance feature inputs to include in your DFD
**Categorical (5):**
- `age_group`, `gender`, `performance`, `year_of_study`, `social_activity`

**Binary (10):**
- `lack_of_school_material`, `lack_of_school_fees`, `job_opportunity`, `pregnancy`,
  `family_conflicts`, `drug_abuse`, `lack_of_motivation`, `illness`, `absenteeism`, `bad_discipline`

### Outputs/derived data to label as flows
- `risk_probability`
- `at_risk`

---

## 6) Detailed DFD: Pre-fill Today’s Form
- Frontend → Backend: `GET /api/attendance/student/:id`
- Backend reads from **Attendance** store (today’s record, if exists)
- Backend returns saved values for UI pre-fill

---

## 7) Detailed DFD: Dashboard KPIs
- Frontend → Backend: KPI endpoints (summary/today list)
- Backend reads Attendance store
- Backend aggregates:
  - recorded count
  - at-risk count
  - safe count
  - average risk percentage
- Backend returns KPI artifacts to Frontend

---

## 8) Detailed DFD: Report Download
- Frontend → Backend: `GET /api/reports/school/:id/download?date=YYYY-MM-DD`
- Backend reads required records from Attendance/Students/Classes/Schools
- Backend generates a **Generated PDF** artifact
- Backend returns/downloads PDF

---

## 9) Authorization Rules to include as a process
- **Teacher**: only students in their assigned class.
- **DOS/Headmaster**: only students within their school.
- **Sector leader**: only schools they created (ownership via `created_by_id`).

---

## 10) Minimum requirement checklist for your diagram
Your Use Case DFD must show:
- Actors → Frontend → Backend processes
- Backend read/write to DB data stores
- Attendance submission triggers ML prediction
- Prediction outputs feed back into Attendance persistence
- Dashboard/KPI aggregation reads from Attendance
- Report generation reads from Attendance and outputs PDF

