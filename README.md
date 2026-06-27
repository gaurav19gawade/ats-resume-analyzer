# ATS Resume Analyzer

Score your resume against any job description, simulate ATS parsing, identify keyword gaps, and get copy-paste-ready LaTeX edits for Overleaf — all in one tool.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Java 21 + Spring Boot 3.2 + Maven |
| Auth + DB | Supabase (magic link auth + PostgreSQL + RLS) |
| AI | Anthropic Claude (Sonnet) via backend only |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Features

- **15 ATS platforms** — Workday, Taleo, iCIMS, SAP SuccessFactors, Greenhouse, Lever, SmartRecruiters, Jobvite, BambooHR, ADP, Bullhorn, Avature, JazzHR, Rippling, Teamtailor + custom
- **Scored analysis** — overall score, 5-dimension breakdown, ATS pass probability
- **Keyword gap analysis** — matched / missing / underrepresented keywords
- **Rejection flag detection** — specific risks that trigger auto-reject
- **Prioritized action plan** — high/medium/low priority changes
- **LaTeX edits** — copy-paste-ready snippets tailored to your Overleaf template
- **JD templates** — save and reuse job descriptions
- **Analysis history** — browse and revisit past results
- **Magic link auth** — no passwords, Supabase-powered

---

## Local Development

### Prerequisites

- Node.js 20+
- Java 21
- Maven 3.9+
- A Supabase project (free tier works)
- An Anthropic API key

### 1. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. In **Project Settings → API**, copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `JWT Secret` → `SUPABASE_JWT_SECRET`
4. In **Project Settings → Database**, copy the connection string (URI) → `DATABASE_URL`
5. In **Authentication → URL Configuration**, add `http://localhost:5173/auth/callback` to Redirect URLs

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, SUPABASE_JWT_SECRET, DATABASE_URL, ALLOWED_ORIGINS
```

Run with env vars:
```bash
export $(cat .env | xargs) && mvn spring-boot:run
```

Or add `.env` values to your IDE run config. Backend starts on `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL=http://localhost:8080
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

---

## Deployment

### Supabase (Auth redirect URL)

Add your Vercel production URL to **Authentication → URL Configuration → Redirect URLs**:
```
https://your-app.vercel.app/auth/callback
```

### Backend → Render

Render expects a `Dockerfile` — ours lives at `backend/Dockerfile`.

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend` — Render will find the `Dockerfile` there
4. **Environment** → `Docker`  (Render auto-detects this once root dir is set)
5. Set **Health Check Path** to `/api/health`
6. Add environment variables in Render dashboard:
   ```
   ANTHROPIC_API_KEY=...
   SUPABASE_JWT_SECRET=...
   DATABASE_URL=...
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

> The `Dockerfile` uses a two-stage build (Maven build → JRE runtime) so the final image is lean and runs as a non-root user.

### Frontend → Vercel

1. Import repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_API_BASE_URL=https://your-render-service.onrender.com
   ```

---

## Project Structure

```
ats-resume-analyzer/
├── .github/workflows/
│   ├── frontend-ci.yml       # Type check + Vite build
│   └── backend-ci.yml        # Maven verify
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── frontend/
│   └── src/
│       ├── api/              # Axios client + service functions
│       ├── components/
│       │   ├── layout/       # Nav + Layout wrapper
│       │   ├── results/      # ScoreRing, ResultsDashboard
│       │   └── wizard/       # Step1, Step2, Step3
│       ├── context/          # AuthContext, WizardContext
│       ├── lib/              # Supabase client
│       ├── pages/            # LoginPage, AnalyzePage, HistoryPage, TemplatesPage
│       └── types/            # Shared TypeScript types + ATS platform list
└── backend/
    └── src/main/java/com/gaurav/atsanalyzer/
        ├── client/           # AnthropicClient
        ├── config/           # AppProperties, SecurityConfig
        ├── controller/       # Analyze, Template, History, Health, GlobalExceptionHandler
        ├── dto/              # Request/Response DTOs
        ├── model/            # JPA entities
        ├── repository/       # Spring Data repos
        ├── security/         # SupabaseJwtFilter, AuthenticatedUser
        └── service/          # AnalyzeService, TemplateService, HistoryService
```

---

## Security notes

- Anthropic API key is held server-side only — never sent to the browser
- Every backend route validates the Supabase JWT via `SupabaseJwtFilter`
- Supabase RLS policies ensure users can only access their own data
- Input is sanitized and capped (4,000 chars each for JD and resume) server-side
- CORS is locked to explicit allowed origins

---

## GitHub Secrets (for CI)

Add these in **Settings → Secrets → Actions**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_BASE_URL
```
