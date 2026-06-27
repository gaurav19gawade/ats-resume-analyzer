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

- **16 ATS platforms** — Workday, Taleo, iCIMS, SAP SuccessFactors, Greenhouse, Lever, SmartRecruiters, Jobvite, BambooHR, ADP, Bullhorn, Avature, JazzHR, Rippling, Teamtailor + custom
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
- `psql` for connection testing (`brew install libpq && brew link --force libpq`)

### 1. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full migration:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. In **Project Settings → API**, copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `JWT Secret` → `SUPABASE_JWT_SECRET`
4. In **Project Settings → Database → Connection pooling**, copy the pooler connection string → `DATABASE_URL`
   - Use the **pooler** URL (port `6543`), not the direct connection (port `5432`)
   - Format it as: `jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:6543/postgres?user=postgres.[ref]&password=[password]&sslmode=require`
5. In **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: add `http://localhost:5173/auth/callback`

### 2. Test DB connection locally

Before starting the backend, verify Supabase is reachable:

```bash
chmod +x test-db.sh
./test-db.sh
```

You should see `Connection successful!`. If not, double-check your pooler URL and password.

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in all values — see .env.example for reference
```

Run:
```bash
export $(cat .env | xargs) && mvn spring-boot:run
```

Backend starts on `http://localhost:8080`. Verify it's up:
```bash
curl http://localhost:8080/api/health
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# Set VITE_API_BASE_URL=http://localhost:8080
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

---

## Deployment

Deploy in this order: **Supabase → Render (backend) → Vercel (frontend)** — each step depends on the previous.

---

### Step 1 — Supabase

Run the migration SQL if not done already:
- **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql` → Run

You'll come back to add the Vercel URL after Step 3.

---

### Step 2 — Render (backend)

The backend uses Docker. The `Dockerfile` is at the **repo root** (not inside `backend/`) because Render uses the repo root as the Docker build context.

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo (`gaurav19gawade/ats-resume-analyzer`)
3. Leave **Root Directory** blank (Render uses repo root for Docker builds)
4. Render auto-detects the `Dockerfile` and `render.yaml`
5. Go to **Environment** in the left sidebar and add:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `SUPABASE_JWT_SECRET` | From Supabase → Project Settings → API → JWT Secret |
| `DATABASE_URL` | Pooler JDBC URL (port 6543, `sslmode=require`) — see note below |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (update after Vercel deploy) |

> **Important — DATABASE_URL format for Render:**
> Render free tier blocks outbound port 5432 (direct Supabase connection).
> You **must** use the Supabase connection pooler on port 6543:
> ```
> jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:6543/postgres?user=postgres.[your-ref]&password=[password]&sslmode=require
> ```
> Get this from: Supabase → Project Settings → Database → Connection pooling → Connection string (change to URI mode)

6. Render will deploy automatically. Check **Events** tab for build progress.
7. Verify: `https://your-render-url.onrender.com/api/health` should return `{"status":"UP",...}`

> **Note:** On Render free tier, the service spins down after 15 minutes of inactivity. First request after sleep takes ~30 seconds to cold-start.

---

### Step 3 — Vercel (frontend)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import `ats-resume-analyzer`
2. Set **Root Directory** to `frontend`
3. Framework preset auto-detects as **Vite**
4. Add environment variables:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://[your-ref].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | From Supabase → Project Settings → API → anon public |
| `VITE_API_BASE_URL` | `https://your-render-url.onrender.com` |

5. Click **Deploy**
6. Note your Vercel production URL (e.g. `https://ats-resume-analyzer-ten-peach.vercel.app`)

> The `frontend/vercel.json` file handles SPA routing — all paths route through `index.html` so React Router works correctly on page refresh and magic link redirects.

---

### Step 4 — Wire everything together

After you have the Vercel URL, update two places:

**Supabase → Authentication → URL Configuration:**
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/auth/callback`
  - Keep `http://localhost:5173/auth/callback` for local dev

**Render → Environment:**
- Update `ALLOWED_ORIGINS` to `https://your-app.vercel.app`
- Render will auto-redeploy

---

### Deployment checklist

```
☐ Supabase migration SQL executed
☐ Render service created, all 4 env vars set
☐ Render deploy successful — /api/health returns UP
☐ Vercel project created, root dir = frontend, all 3 VITE_ vars set
☐ Vercel deploy successful — login page loads
☐ Supabase Site URL updated to Vercel production URL
☐ Supabase Redirect URL updated to https://your-app.vercel.app/auth/callback
☐ Render ALLOWED_ORIGINS updated to Vercel URL
☐ Magic link email arrives and redirects to /auth/callback correctly
☐ Login works end-to-end
```

---

## Project Structure

```
ats-resume-analyzer/
├── Dockerfile                    # Root-level — used by Render (build context = repo root)
├── render.yaml                   # Render service config
├── test-db.sh                    # Local Supabase connection test script
├── .github/workflows/
│   ├── frontend-ci.yml           # Type check + Vite build
│   └── backend-ci.yml            # Maven verify + Docker build
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── frontend/
│   ├── vercel.json               # SPA routing — routes all paths to index.html
│   └── src/
│       ├── api/                  # Axios client + service functions
│       ├── components/
│       │   ├── layout/           # Nav + Layout wrapper
│       │   ├── results/          # ScoreRing, ResultsDashboard
│       │   └── wizard/           # Step1, Step2, Step3
│       ├── context/              # AuthContext, WizardContext
│       ├── lib/                  # Supabase client
│       ├── pages/                # LoginPage, AnalyzePage, HistoryPage, TemplatesPage
│       └── types/                # Shared TypeScript types + ATS platform list
└── backend/
    ├── .env.example
    ├── pom.xml
    └── src/main/java/com/gaurav/atsanalyzer/
        ├── client/               # AnthropicClient
        ├── config/               # AppProperties, SecurityConfig
        ├── controller/           # Analyze, Template, History, Health, GlobalExceptionHandler
        ├── dto/                  # Request/Response DTOs
        ├── model/                # JPA entities
        ├── repository/           # Spring Data repos
        ├── security/             # SupabaseJwtFilter, AuthenticatedUser
        └── service/              # AnalyzeService, TemplateService, HistoryService
```

---

## Key gotchas (lessons learned)

| Issue | Fix |
|---|---|
| GitHub push rejected with "invalid credentials" | GitHub no longer accepts passwords — use `gh auth login` or a PAT |
| Dockerfile `COPY src` fails on Render | Dockerfile must be at repo root; use `COPY backend/src ./src` |
| `runtime: java` in render.yaml fails | Render only supports `docker`, `node`, `python` etc — use `runtime: docker` |
| `postgresql://` URL fails in Spring | Spring needs `jdbc:postgresql://` prefix |
| Port 5432 unreachable on Render free tier | Use Supabase connection pooler on port 6543 |
| Magic link redirects to localhost | Fix Supabase Site URL and Redirect URLs to point to Vercel domain |
| Magic link lands on Vercel 404 | Add `frontend/vercel.json` with SPA rewrite rule |

---

## Security notes

- Anthropic API key is held server-side only — never sent to the browser
- Every backend route validates the Supabase JWT via `SupabaseJwtFilter`
- Supabase RLS policies ensure users can only access their own data
- Input is sanitized and capped (4,000 chars each for JD and resume) server-side
- CORS is locked to explicit allowed origins

---

## GitHub Secrets (for CI)

Add in **Settings → Secrets → Actions**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_BASE_URL
```
