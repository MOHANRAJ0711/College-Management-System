# EduManager - College Management System

A comprehensive, full-stack College Management System built with React, Node.js, Express, and MongoDB.

## Features

### Core Modules

- **Admission Management** — Online applications, document upload, merit list generation
- **Student Management** — Profiles, course enrollment, ID generation
- **Faculty Management** — Profiles, subject allocation, timetable assignment
- **Course & Department Management** — Department and course CRUD
- **Attendance Management** — Daily marking, percentage tracking, reports
- **Exam & Result System** — Exam scheduling, marks entry, result publishing
- **Fee Management** — Fee payment, receipt generation, reports
- **Notification System** — Circulars and announcements
- **Timetable Management** — Class and exam schedules
- **Library Management** — Book search, issue/return
- **Placement Management** — Company drives, student applications
- **Certificate Generation** — Degree and provisional certificates (PDF)

### User Roles

- **Admin** — Full system control
- **Student** — View data, apply, pay fees, check results
- **Faculty** — Mark attendance, upload marks, view timetable

## Tech Stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React 18, Vite, TailwindCSS v4, React Router v6 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT (JSON Web Tokens) |
| **PDF** | PDFKit for certificate generation |
| **File Upload** | Multer |

## Project Structure

```
EduManager/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/              # Route handlers (business logic)
│   ├── middleware/
│   │   ├── auth.js               # JWT protect / role authorize
│   │   └── upload.js             # Multer file uploads
│   ├── models/                   # Mongoose schemas
│   ├── routes/                   # Express routers → mounted under /api/*
│   ├── uploads/                  # Static uploads (served at /uploads)
│   ├── utils/
│   │   ├── seed.js               # Database seed script
│   │   ├── generateToken.js
│   │   ├── generatePDF.js
│   │   └── handleError.js
│   ├── .env                      # Local secrets (not committed)
│   ├── .env.example              # Template for environment variables
│   ├── package.json
│   └── server.js                 # App entry; registers routes & error handler
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # Shared UI (layout, tables, forms)
│   │   ├── context/              # e.g. AuthContext
│   │   ├── hooks/
│   │   ├── pages/                # admin / faculty / student / public pages
│   │   ├── services/             # API client (api.js)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js            # Dev server port 3000, proxies /api → backend
│   └── package.json
│
└── README.md
```

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB Atlas** account (recommended) or local MongoDB
- **npm** or **yarn**

## Setup Instructions

### 1. Clone or open the project

Place the project on your machine and open a terminal at the repository root (this folder).

### 2. MongoDB Atlas setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com).
2. Sign up or sign in (e.g. with your institutional or personal Google account).
3. Create a **free M0** cluster.
4. Create a **database user** (username/password).
5. **Network Access**: add your current IP, or `0.0.0.0/0` for local development only.
6. **Connect** → copy the **connection string** (replace `<password>` and optionally set database name).
7. Put the URI in `backend/.env` as `MONGODB_URI` (see [Environment variables](#environment-variables)).

### 3. Backend setup

```bash
cd backend
cp .env.example .env   # Edit .env: set MONGODB_URI, JWT_SECRET, etc.
npm install
npm run seed             # Optional: loads sample users and data (prompts before wipe)
npm run dev              # Development server (default port 5000)
```

> **Seed script:** Run from the `backend` folder: `node utils/seed.js`. It asks for confirmation before **dropping** the database and inserting demo data.

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev              # Vite dev server — http://localhost:3000 (proxies /api to :5000)
```

Ensure the backend is running on port **5000** (or adjust the proxy in `frontend/vite.config.js`) so API calls succeed.

## Default login credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | admin123 |
| Faculty | faculty1@college.edu | faculty123 |
| Faculty | faculty2@college.edu | faculty123 |
| Student | student1@college.edu | student123 |
| Student | student2@college.edu | student123 |
| Student | student3@college.edu | student123 |

## API endpoints

Base URL: `http://localhost:5000/api` (or your deployed host).  
Unless noted, routes expect `Authorization: Bearer <token>` for protected handlers.

### Authentication (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login; returns JWT |
| GET | `/auth/me` | Current user profile |
| PUT | `/auth/profile` | Update profile |
| PUT | `/auth/change-password` | Change password |

### Students (`/api/students`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/students/dashboard` | Student dashboard |
| GET | `/students` | List students (admin, faculty) |
| POST | `/students` | Create student (admin) |
| GET | `/students/:id` | Get one student |
| PUT | `/students/:id` | Update student (admin) |
| DELETE | `/students/:id` | Delete student (admin) |

### Faculty (`/api/faculty`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/faculty/dashboard` | Faculty dashboard |
| GET | `/faculty` | List faculty (admin) |
| POST | `/faculty` | Create faculty (admin) |
| GET | `/faculty/:id` | Get one faculty |
| PUT | `/faculty/:id` | Update faculty (admin) |
| DELETE | `/faculty/:id` | Delete faculty (admin) |

### Departments (`/api/departments`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/departments` | List departments (public) |
| GET | `/departments/:id` | Get one department |
| POST | `/departments` | Create (admin) |
| PUT | `/departments/:id` | Update (admin) |
| DELETE | `/departments/:id` | Delete (admin) |

### Courses (`/api/courses`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses` | List courses |
| GET | `/courses/:id` | Get one course |
| POST | `/courses` | Create (admin) |
| PUT | `/courses/:id` | Update (admin) |
| DELETE | `/courses/:id` | Delete (admin) |

### Attendance (`/api/attendance`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/attendance/mark` | Mark attendance (faculty) |
| GET | `/attendance` | List/filter attendance (admin, faculty) |
| GET | `/attendance/student` | Own attendance (student) |
| GET | `/attendance/report/:courseId` | Report for a course (faculty, admin) |
| PUT | `/attendance/:id` | Update a record (faculty) |

### Exams (`/api/exams`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/exams` | Create exam (admin) |
| GET | `/exams` | List exams |
| GET | `/exams/:id` | Get one exam |
| PUT | `/exams/:id` | Update (admin) |
| DELETE | `/exams/:id` | Delete (admin) |

### Results (`/api/results`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/results/enter` | Enter marks (faculty) |
| GET | `/results/student` | Own results (student) |
| GET | `/results` | List results |
| PUT | `/results/publish/:examId` | Publish results (faculty, admin) |
| GET | `/results/analysis/:examId` | Analysis for an exam (faculty, admin) |

### Fees (`/api/fees`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/fees` | Create fee record (admin) |
| GET | `/fees/student` | Own fees (student) |
| GET | `/fees/history` | Payment history (student) |
| GET | `/fees/report` | Fee report (admin) |
| GET | `/fees` | List fees (admin) |
| PUT | `/fees/pay/:id` | Pay a fee (student) |

### Admissions (`/api/admissions`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admissions/apply` | Submit application (public) |
| GET | `/admissions/status/:applicationNumber` | Application status (public) |
| GET | `/admissions` | List applications (admin) |
| GET | `/admissions/merit/:departmentId` | Merit list (admin) |
| GET | `/admissions/:id` | Get one application (admin) |
| PUT | `/admissions/:id/status` | Update status (admin) |

### Timetable (`/api/timetable`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/timetable` | Create entry (admin) |
| GET | `/timetable` | Get timetable |
| PUT | `/timetable/:id` | Update (admin) |
| DELETE | `/timetable/:id` | Delete (admin) |

### Notifications (`/api/notifications`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/notifications` | Create (admin) |
| GET | `/notifications` | List notifications |
| GET | `/notifications/:id` | Get one |
| PUT | `/notifications/:id` | Update (admin) |
| DELETE | `/notifications/:id` | Delete (admin) |

### Library (`/api/library`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/library/books` | Add book (admin) |
| GET | `/library/books` | List books |
| GET | `/library/books/:id` | Get one book |
| PUT | `/library/books/:id` | Update book (admin) |
| POST | `/library/issue` | Issue book (admin) |
| PUT | `/library/return/:id` | Return issue (admin) |
| GET | `/library/student-issues` | Own issues (student) |
| GET | `/library/issues` | Issue history (admin) |

### Placements (`/api/placements`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/placements` | Create drive (admin) |
| GET | `/placements/student-applications` | Own applications (student) |
| GET | `/placements` | List drives |
| GET | `/placements/:id` | Get one drive |
| PUT | `/placements/:id` | Update drive (admin) |
| POST | `/placements/:id/apply` | Apply (student) |
| PUT | `/placements/:id/applicant/:studentId` | Update applicant status (admin) |

### Certificates (`/api/certificates`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/certificates/verify/:certificateNumber` | Verify certificate (public) |
| POST | `/certificates/generate` | Generate (admin) |
| GET | `/certificates/student` | Own certificates (student) |
| GET | `/certificates/download/:id` | Download PDF (student, admin) |
| GET | `/certificates` | List all (admin) |

### Dashboard (`/api/dashboard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/admin` | Admin dashboard stats |

## Environment variables

Configure these in `backend/.env` (see `backend/.env.example`).

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas or local). |
| `JWT_SECRET` | Yes | Secret for signing JWTs; use a long random string in production. |
| `JWT_EXPIRE` | No | Token lifetime (e.g. `30d`, `7d`). Defaults depend on code usage. |
| `PORT` | No | HTTP port for Express (default **5000**). |
| `NODE_ENV` | No | `development` or `production` (affects error stack traces). |
| `COLLEGE_NAME` | No | Institution name on generated PDFs (certificates). |
| `LIBRARY_FINE_PER_DAY` | No | Daily late fine for library returns (numeric; default used in controller if unset). |

## Screenshots

_Add screenshots of the dashboard, student portal, and admin panels here._

## License

MIT
