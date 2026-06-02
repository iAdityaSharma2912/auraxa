# AURAXA

### *Feel The Unsaid.*

An AI-powered emotional intelligence SaaS platform that decodes conversations, relationship dynamics, and hidden behavioral patterns.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Framer Motion |
| Backend | FastAPI (Python 3.12), Celery, Redis |
| Database | PostgreSQL 16 via Supabase |
| AI | OpenRouter → GPT-4o-mini (analysis), GPT-4o (advisor) |
| OCR | PaddleOCR + Tesseract + OpenCV |
| Auth | NextAuth v5, Google OAuth, JWT |
| Payments | Razorpay (India), Stripe (Global) |
| Deploy | Vercel (frontend), Railway (backend + worker) |

---

## Project Structure

```
auraxa/
├── auraxa-web/          ← Next.js 15 frontend
│   ├── app/
│   │   ├── (marketing)/ ← Landing page
│   │   ├── (auth)/      ← Login
│   │   └── (dashboard)/ ← Protected app
│   ├── components/
│   ├── lib/
│   └── types/
├── auraxa-api/          ← FastAPI backend
│   ├── app/
│   │   ├── api/         ← Route handlers
│   │   ├── core/        ← Config, DB, security
│   │   ├── models/      ← SQLAlchemy models
│   │   ├── schemas/     ← Pydantic schemas
│   │   ├── services/    ← OCR, AI, business logic
│   │   └── tasks/       ← Celery async tasks
│   └── alembic/         ← DB migrations
└── docker-compose.yml   ← Full local stack
```

---

## Quick Start (Local Dev)

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker + Docker Compose (recommended)

---

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone and enter the project
git clone https://github.com/iAdityaSharma2912/auraxa.git
cd auraxa

# 2. Set up backend env
cp auraxa-api/.env.example auraxa-api/.env
# Edit auraxa-api/.env with your API keys

# 3. Set up frontend env
cp auraxa-web/.env.local.example auraxa-web/.env.local
# Edit auraxa-web/.env.local with your keys

# 4. Start everything
docker-compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# API docs → http://localhost:8000/docs
```

---

### Option B — Manual Setup

#### Backend

```bash
cd auraxa-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (new terminal)
celery -A app.tasks.analysis_tasks.celery_app worker --loglevel=info
```

#### Frontend

```bash
cd auraxa-web

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Start dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### Frontend (`auraxa-web/.env.local`)

| Variable | Description | Where to get |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL | `http://localhost:8000` for local |
| `NEXTAUTH_URL` | Frontend URL | `http://localhost:3000` for local |
| `NEXTAUTH_SECRET` | Random secret | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Same as above |

### Backend (`auraxa-api/.env`)

| Variable | Description | Where to get |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | [Supabase Dashboard](https://supabase.com) |
| `REDIS_URL` | Redis connection string | [Railway](https://railway.app) |
| `JWT_SECRET` | JWT signing secret | Run `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | AI API key | [OpenRouter](https://openrouter.ai/keys) |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Supabase Dashboard → API |
| `RAZORPAY_KEY_ID` | Razorpay key | [Razorpay Dashboard](https://dashboard.razorpay.com) |
| `STRIPE_SECRET_KEY` | Stripe secret | [Stripe Dashboard](https://dashboard.stripe.com) |

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → "APIs & Services" → "Credentials"
3. Create OAuth 2.0 Client ID (Web Application)
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://auraxa.app/api/auth/callback/google` (production)
5. Copy Client ID and Secret to `.env.local`

---

## Database Migrations

```bash
cd auraxa-api

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## Deployment

### Frontend → Vercel

```bash
cd auraxa-web
npx vercel --prod
# Add env vars in Vercel dashboard → Settings → Environment Variables
```

### Backend → Railway

1. Push `auraxa-api/` to a GitHub repo
2. Create new Railway project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway auto-detects Dockerfile and deploys

### Celery Worker → Railway

1. Add a second Railway service in the same project
2. Set the start command: `celery -A app.tasks.analysis_tasks.celery_app worker --loglevel=info`
3. Share the same env vars

### Database → Supabase

1. Create a new Supabase project
2. Copy the connection string from Project Settings → Database
3. Run migrations against it: `alembic upgrade head`

---

## Development Phases

| Phase | Focus | Timeline |
|---|---|---|
| **Phase 1** (current) | Foundation, auth, upload, OCR pipeline | Weeks 1–4 |
| **Phase 2** | AI analysis engine, results dashboard | Weeks 5–8 |
| **Phase 3** | AI Advisor, timelines, payments, share cards | Weeks 9–12 |
| **Phase 4** | Astrology, palm analysis, PDF export | Weeks 13–18 |
| **Phase 5** | React Native mobile app, scale | Weeks 19–24+ |

---

## API Documentation

Interactive Swagger UI available at: `http://localhost:8000/docs`

ReDoc available at: `http://localhost:8000/redoc`

---

## Built by

**Aditya Sharma** — [github.com/iAdityaSharma2912](https://github.com/iAdityaSharma2912) · [@iaddy29](https://twitter.com/iaddy29)
