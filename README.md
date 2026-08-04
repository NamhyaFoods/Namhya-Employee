📄 README.md (Minimal & Professional)
markdown
# 🚀 Employee Task & Performance Management Dashboard

A secure, role-based platform for task allocation, time tracking, and automated performance evaluation.

---

## ✨ Features

- 🔐 **Role-based Access** - Admin, Manager, Employee with separate dashboards
- 📋 **Task Management** - Create, assign, track progress with allocated hours
- ⏱️ **Time Tracking** - Log actual hours, auto-calculate efficiency
- 📊 **Performance Scoring** - Automated work score (out of 5) with configurable weights
- 📅 **Monthly Reviews** - Auto-generated performance reviews with KPI tracking
- 📁 **Bulk Import** - CSV/Excel support for employees and tasks
- 🔍 **Audit Trail** - Complete history of all changes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts |
| **Backend** | FastAPI, Python, Supabase, JWT |
| **Database** | PostgreSQL (Supabase) |

---

## 🚀 Quick Start

### 1️⃣ Clone & Setup
```bash
git clone https://github.com/yourusername/employee-performance-dashboard.git
cd employee-performance-dashboard
2️⃣ Backend
bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase credentials
uvicorn app.main:app --reload --port 8000
3️⃣ Frontend
bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
4️⃣ Access
Frontend: http://localhost:5173

Backend API: http://localhost:8000

API Docs: http://localhost:8000/docs

🔑 Default Login
Role	Email	Password
Admin	admin@company.com	Admin123!
Manager	manager@company.com	Manager123!
Employee	employee@company.com	Employee123!
📁 Project Structure
text
backend/          # FastAPI backend
frontend/         # React frontend
supabase/         # Database migrations
docs/             # Documentation
📊 Progress
text
Database:   ████████████████████ 100% ✅
Backend:    ████████████████████ 100% ✅
Frontend:   ████████████████████ 100% ✅
Testing:    ████████░░░░░░░░░░░░  40% ⏳
Deployment: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
🔧 Environment Variables
Backend (.env)
env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
JWT_SECRET=your_secret_key
CORS_ORIGINS=http://localhost:5173
Frontend (.env)
env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000/api/v1
📚 API Documentation
Once running: http://localhost:8000/docs

Key endpoints:

POST /api/v1/auth/login - Login

GET /api/v1/tasks - Get tasks

POST /api/v1/tasks - Create task (admin)

GET /api/v1/performance/my-performance - My performance

POST /api/v1/reviews/generate-all - Generate reviews (admin)

🐛 Common Issues
Login fails with "null value in column full_name"

sql
-- Fix Supabase trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (auth_user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$function$

👤 Author
Shreya R Chittaragi