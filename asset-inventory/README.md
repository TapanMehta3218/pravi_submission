# InfraTrack — Infrastructure Asset Lifecycle Inventory

A working local hackathon PoC for tracking infrastructure from planning through retirement. React + Vite, JavaScript, Tailwind CSS, React Router, Recharts, Lucide, Express, better-sqlite3, date-fns, and a Groq + LangChain assistant.

## Setup

Requires Node.js 22+ and npm. In Windows PowerShell, use `npm.cmd` / `npx.cmd` if the execution policy blocks `npm.ps1`.

```bash
git clone <repo>
cd asset-inventory
npm install
npm run install:all
npm run configure --prefix server
npm run seed
npm run dev
```

Or start the two processes separately:

```bash
cd asset-inventory/server
npm install
npm run configure
npm run seed
npm run dev
```

```bash
cd asset-inventory/client
npm install
npm run dev
```

- Frontend default: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/api/health

**Current workspace:** port 5173 belongs to another project, so InfraTrack is running at **http://localhost:5174**. Use `npm run dev -- --port 5174` inside `client` to use that port again. Both services bind to loopback for this local demo.

## Authentication and first-time setup

1. Run `npm run configure` in `server`. This generates strong random `JWT_SECRET` and `SETUP_TOKEN` values in `server/.env`, preserving existing configured secrets. It has already been run in this workspace.
2. Start the server and client, then open http://localhost:5174 (or 5173 if using the default port).
3. The first visit shows **Create your administrator account**. Copy `SETUP_TOKEN` from `server/.env` into **Workspace setup key**, then enter your name, email, and a unique password of at least 12 characters. These are your login credentials; there is no default password.
4. Setup signs you in and returns you to the page you originally requested. Once any account exists, setup is permanently disabled and the screen becomes **Sign in**. The setup key is not a login password.
5. The initials menu in the top bar opens **Your account** and **Sign out**. Password changes require the current password and revoke all other sessions.

All inventory, dashboard, maintenance, reporting, metadata, and AI routes require authentication. Passwords are bcrypt-hashed with cost 12. JWTs use HS256 with issuer/audience validation and expire after 8 hours. Tokens are kept in HttpOnly, SameSite=Strict cookies, with Secure enabled under `NODE_ENV=production`. SQLite session records allow immediate logout revocation; tokens are never stored in browser localStorage. State-changing requests require a session-bound CSRF token and a custom request header, and configured browser origins are checked. Login/setup failures are rate-limited. Authenticated edits record the account email in the asset timeline.

This is a single-administrator workspace: there is no public registration, email recovery service, or multi-role user-management UI. Password changes are available while signed in. Authentication implementation references: [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [Express CORS](https://expressjs.com/en/resources/middleware/cors/).

### Environment values / placeholders

| File | Variable | What to enter |
| --- | --- | --- |
| `server/.env` | `JWT_SECRET` | Already generated. Keep private; `npm run configure` generates it for a new install. |
| `server/.env` | `SETUP_TOKEN` | Already generated. Copy it into the setup form once; keep it private. |
| `server/.env` or workspace `.env` | `GROQ_API_KEY` | Your valid Groq API key, only needed for model-backed AI. |
| `server/.env` | `GROQ_MODEL` | Optional; defaults to `llama-3.3-70b-versatile`. |
| `server/.env` | `PORT` | Optional; defaults to `3001`. |
| `server/.env` | `CLIENT_ORIGINS` | Optional locally; defaults include localhost/127.0.0.1 on 5173 and 5174. For deployment, set the exact allowed frontend origin(s), separated by commas. |
| `client/.env` | `VITE_API_URL` | Optional; defaults to `/api`. Vite proxies requests to the backend so cookies stay same-origin. |
| Server process | `DB_PATH` | Optional absolute SQLite file path. Omit to use `server/data/assets.db`. |

**No MongoDB URI, SQLite URI, cloud database account, or database password is needed.** Existing assets stay in the same SQLite database; startup adds `users` and `auth_sessions` tables without replacing inventory data. Restart the backend after editing server environment values. Never put JWT or Groq secrets in `VITE_` variables.

For HTTPS deployment, use `NODE_ENV=production`, a strong private JWT secret, an exact `CLIENT_ORIGINS` allowlist, and a reverse proxy that routes `/api` to Express on the same site. The Vite proxy is for development; static hosting must supply the `/api` reverse-proxy route. Cookie authentication assumes the frontend and API are on the same site.

## Included flows

- Executive dashboard with SQLite-backed KPIs, lifecycle/category/condition charts, maintenance attention, warranty watch, replacement planning, and recent events.
- 24 realistic assets covering all 16 categories, eight lifecycle stages, and ten Pune campus locations.
- Asset creation, detail, editing, assignment, relocation, retirement, confirmed deletion, and persistent history.
- Search by code/name/manufacturer/model/serial/location/custodian, plus all six requested filters.
- Maintenance scheduling, editing/cancellation, completion with findings/action/cost, tabs for overdue/upcoming/completed, and automatic timeline entries.
- Location summaries, warranty/EOL reports, and CSV export.
- Responsive layout, loading/error/empty states, confirmation dialogs, and success notifications.
- Server-side validation, prepared SQL, transactions for mutations and events, SQLite foreign keys and WAL.

## Groq + LangChain assistant

The server loads `server/.env` first and then the existing workspace `.env` at `../../.env`. It never sends the key to the browser. Configure:

```dotenv
GROQ_API_KEY=your-valid-key
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3001
```

Restart the server after changing environment values. `AI_ENABLED=false` forces local mode. `client/.env` can override the single API address; keep the default `VITE_API_URL=/api` for local cookie authentication.

The assistant uses `ChatPromptTemplate → ChatGroq → StringOutputParser` to translate each independent question into a Zod-validated filter plan. The server retrieves records using the same prepared-query inventory services, then sends a bounded selection of operational facts to Groq for a concise answer. It does not execute model-written SQL or permit mutations. Questions and selected asset/job fields are sent to Groq when enabled; credentials, notes, and custodian details are not included in the retrieved context. Responses link back to real records. At most 30 records are used for summarization and 12 asset links are displayed; totals reflect all matches.

If the key is missing, rejected, rate-limited, or the provider times out/returns invalid output, local rules answer supported inventory questions with a clear fallback label. The inventory remains fully functional. A global local-demo limit allows 20 assistant requests per minute.

Examples:

- “What maintenance is overdue?”
- “Which warranties expire in the next 90 days?”
- “Show critical assets under maintenance.”
- “Show pumps in poor condition.”
- “Give me an inventory overview.”

**Verification on this workspace:** the supplied key returned HTTP 401 `invalid_api_key` from Groq. Replace its value locally to enable real model responses. Provider success could not be verified with that key; the connected fallback was tested.

Integration references: [LangChain ChatGroq](https://docs.langchain.com/oss/javascript/integrations/chat/groq), [Groq models](https://console.groq.com/docs/models), [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite).

## Data and business rules

- Persistent database: `server/data/assets.db`; created automatically. `DB_PATH` can override it for testing.
- Startup seeds an empty database. `npm run seed` is idempotent and preserves existing data.
- Seed dates are relative to the day the database is first initialized: two overdue jobs, four upcoming jobs, two completed jobs, two expiring warranties, and two EOL review assets.
- Maintenance attention includes open jobs through the next 30 days. Completed and cancelled jobs are excluded. Overdue means before today.
- Warranty alerts cover today through 90 days; EOL uses purchase date plus expected useful life and a one-year horizon. Retired assets are excluded from actionable warranty/EOL/critical alerts.
- Total procurement value includes all registered assets, including retired assets; it is not depreciated book value.
- Completion is idempotent and records one completion event. Completion does not automatically change asset lifecycle; operational readiness is an explicit manager action.
- Asset deletion permanently removes its maintenance and events after confirmation. Retirement preserves its audit trail.

## REST API

Base `/api`. Errors use `{ "error": "..." }` with 400/404/500 statuses.

Authentication errors use 401; rejected CSRF/origin/setup keys use 403; repeated setup uses 409; rate limits use 429. Public routes are `/health`, `/auth/status`, `/auth/login`, and one-time `/auth/setup`. `GET /auth/me` returns the current user and CSRF token. `POST /auth/logout` revokes the session; `POST /auth/password` changes the password. Both require authentication and CSRF. For direct API clients, retain the login response cookie, include `X-Requested-With: InfraTrack` on mutations, and send `X-CSRF-Token` from login or `/auth/me` on authenticated mutations.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /health | Health status |
| GET | /metadata | Enums and locations |
| GET/POST | /assets | Filter/list or register |
| GET/PUT/DELETE | /assets/:id | Detail/update/delete |
| PATCH | /assets/:id/lifecycle | `{ "stage": "OPERATIONAL" }` |
| GET/POST | /assets/:id/maintenance | List/schedule |
| GET | /maintenance | All jobs |
| PUT/DELETE | /maintenance/:id | Update/delete job |
| PATCH | /maintenance/:id/complete | Complete with findings and costs |
| GET | /dashboard | Aggregated metrics, alerts, distributions, events |
| GET | /locations | Location counts/value |
| GET | /assistant/status | Configuration presence (not provider health) |
| POST | /assistant | `{ "question": "What maintenance is overdue?" }` |

Asset list parameters: `search`, `category`, `stage`, `condition`, `criticality`, `location`. List APIs return arrays. Asset details include `maintenance`, `events`, and `estimated_eol`.

## Verification

```bash
cd asset-inventory
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests automatically start isolated servers on ports 5175 and 3002 with an in-memory SQLite database and test-only credentials. They do not modify your real workspace, require your password, or call Groq. They verify setup, wrong-password errors, destination-preserving login, reload/session persistence, password changes, logout, session expiry, responsive layouts, and the full asset/maintenance demo. API tests use separate in-memory SQLite and verify JWT/CSRF/origin enforcement, password hashing, revocation, and audit identity. Screenshots are saved under `test-results/`.

## Judge demo (3–5 minutes)

1. Sign in, then open the dashboard and review value, health, lifecycle, and maintenance.
2. Search “Generator” in inventory and open Diesel Generator DG-01.
3. Review procurement, placement, lifecycle, and timeline.
4. Schedule preventive maintenance; open Maintenance and find the job.
5. Mark it complete with findings; return to the asset and show the completion event.
6. Change Operational → Maintenance → Operational and show both timeline entries.
7. Open Asset assistant and ask about expiring warranties or overdue maintenance.

This is a local, single-administrator PoC with JWT authentication. Attachments, CSV import, QR tagging, email recovery, and multi-role account management are not implemented. No external AI service is required for the core demo.
