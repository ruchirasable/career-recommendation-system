# 🔐 Authentication Setup Guide — College Compass

## What Was Added

### Backend (`/backend`)
| File | Purpose |
|------|---------|
| `auth_routes.py` | JWT auth blueprint — signup, login, profile, activity tracking |
| `.env.example` | Environment variable template |
| `requirements.txt` | Added `bcrypt==4.1.3` and `PyJWT==2.8.0` |
| `app.py` | Registered `auth_bp` blueprint |

### Frontend (`/frontend/src`)
| File | Purpose |
|------|---------|
| `context/AuthContext.js` | React context — user state, login/signup/logout/updateProfile |
| `components/ProtectedRoute.jsx` | Redirects unauthenticated users to `/login` |
| `components/Navbar.jsx` | Updated — shows user avatar + dropdown when logged in |
| `pages/Login.jsx` | Two-panel login page with JWT |
| `pages/Signup.jsx` | Two-step signup form |
| `pages/Dashboard.jsx` | Student dashboard with stats, profile editing, history |
| `api/index.js` | Added auth endpoints + auto-attach JWT interceptor |
| `App.js` | Wrapped with `<AuthProvider>`, added protected routes |

---

## MongoDB Collections

The auth system uses the `college_compass` database with these collections:

```
users              — student accounts (hashed password, profile)
test_results       — aptitude test submissions (from existing aptitude module)
iit_history        — IIT search history per user
course_history     — College/course search history per user
```

---

## Setup Instructions

### 1. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and set:
#   MONGO_URI      — your MongoDB connection string
#   JWT_SECRET     — a long random secret (use: openssl rand -hex 32)
```

### 3. Start MongoDB

**Local:**
```bash
mongod --dbpath /data/db
```

**Atlas:** Set `MONGO_URI` in `.env` to your Atlas connection string.

### 4. Run the backend

```bash
cd backend
python app.py
# or with gunicorn:
# gunicorn app:app --bind 0.0.0.0:8000
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
npm start
```

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new student |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get profile + stats |
| POST | `/api/auth/logout` | ✅ | Logout (client removes token) |
| PUT | `/api/auth/profile` | ✅ | Update profile |

### Activity Tracking

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/activity/iit` | ✅ | Save IIT search to history |
| POST | `/api/activity/college` | ✅ | Save college search to history |

### Authorization Header

```
Authorization: Bearer <jwt_token>
```

---

## Protected Routes (Frontend)

These pages require the user to be logged in. Unauthenticated users are redirected to `/login`:

- `/dashboard` — Student dashboard
- `/iit` — IIT Recommendation
- `/college` — College + Course Finder
- `/aptitude` — Aptitude Test
- `/aptitude/admin` — Admin panel

Public routes: `/`, `/login`, `/signup`

---

## Student Data Stored

### User document (`users` collection)
```json
{
  "fullName":   "Arjun Sharma",
  "email":      "arjun@example.com",
  "password":   "<bcrypt hash>",
  "className":  "Class 12 (PCM)",
  "schoolName": "Delhi Public School",
  "createdAt":  "2025-01-01T00:00:00Z"
}
```

### IIT history (`iit_history` collection)
```json
{
  "userId":    "<user_id>",
  "rank":      5000,
  "score":     null,
  "stream":    "Computer Science",
  "category":  "General",
  "results":   [...],
  "createdAt": "..."
}
```

### Course history (`course_history` collection)
```json
{
  "userId":    "<user_id>",
  "subjects":  ["Mathematics", "Physics"],
  "location":  "Delhi",
  "summary":   "...",
  "createdAt": "..."
}
```

---

## Security Notes

1. **JWT Secret**: Change `JWT_SECRET` to a random 32+ byte string in production.
   ```bash
   openssl rand -hex 32
   ```

2. **HTTPS**: Always use HTTPS in production (tokens are in headers).

3. **Password Hashing**: bcrypt with auto-generated salt rounds (default: 12).

4. **Token Expiry**: Default 7 days. Change `JWT_EXPIRY_HOURS` as needed.
