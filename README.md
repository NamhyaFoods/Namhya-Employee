
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
---
```
##4️⃣ Access

Frontend: http://localhost:5173

Backend API: http://localhost:8000

API Docs: http://localhost:8000/docs

---
👤 Author
Shreya R Chittaragi
