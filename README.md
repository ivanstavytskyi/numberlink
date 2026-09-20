<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="frontend/src/public/logo_dark_theme.svg">
  <img src="frontend/src/public/logo_white_theme.svg" alt="NumberLink" width="96" height="96">
</picture>

# NumberLink

**A complete, deployed full-stack application on Java 21 and Spring Boot 4 — OAuth2 and TOTP 2FA, session management, Flyway migrations, Testcontainers, Docker Compose and CI/CD to AWS. The domain is a Numberlink puzzle with a server-side engine.**

[![CI](https://github.com/ivanstavytskyi/numberlink/actions/workflows/ci.yml/badge.svg)](https://github.com/ivanstavytskyi/numberlink/actions/workflows/ci.yml)
![Java 21](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![Spring Boot 4](https://img.shields.io/badge/Spring%20Boot-4.0-6DB33F?logo=springboot&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![PostgreSQL 18](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![AWS EC2 + RDS](https://img.shields.io/badge/AWS-EC2%20%2B%20RDS-FF9900?logo=amazonwebservices&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-DNS%20%2B%20TLS-F38020?logo=cloudflare&logoColor=white)
[![License: MIT](https://img.shields.io/github/license/ivanstavytskyi/numberlink?color=blue)](LICENSE)

[**Play online**](https://numberlink.fly-stack.com) · [Quick start](#quick-start) · [Features](#features) · [Architecture](#architecture) · [Production](#production) · [API](#api-overview) · [Configuration](#configuration)

</div>

---

Connect every pair of equal numbers with a path. Paths may not cross, and together they must fill the whole board. Pick a grid from **7×7** to **11×11**, race the clock, use a hint when stuck, and share the result.

Guest play works out of the box. An account unlocks scores, leaderboard, history, reviews and the settings panel (avatar, OAuth links, two-factor auth, active sessions).

<!-- Hero video: drag an MP4 into the GitHub README editor and paste the resulting user-attachments URL on its own line here. -->

## Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3 align="center">Play</h3>
      <img src="docs/media/play.gif" alt="Choosing a grid size, drawing paths and solving the board">
      <p>Boards are generated on the server (<code>/api/create-map</code>) and validated on the server (<code>/api/map-check</code>), so the client can't cheat. Works with mouse and touch.</p>
    </td>
    <td width="50%" valign="top">
      <h3 align="center">Hints</h3>
      <img src="docs/media/hint.gif" alt="Requesting a hint on a stuck board">
      <p>Stuck? Ask for a hint. The engine checks the current cell state (<code>/api/hint-check</code>) and points to a valid next move. Hints are recorded with the score.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3 align="center">Share a result</h3>
      <img src="docs/media/share.gif" alt="Sharing a finished game and opening the link as a guest">
      <p>Every saved game gets a token. Toggle it between <em>Private</em> and <em>Anyone with the link</em>, copy the link, revoke it later. Visitors see the result and a sign-up prompt.</p>
    </td>
    <td width="50%" valign="top">
      <h3 align="center">History</h3>
      <img src="docs/media/history.gif" alt="History page with stats and filters">
      <p>Every solved puzzle with time, score, hints and pace. Aggregates (games played, best, average, clean solves), filters by board size and period, personal-best badges.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3 align="center">Leaderboard</h3>
      <img src="docs/media/leaderboard.gif" alt="Leaderboard switching between weekly, monthly and all-time">
      <p>Weekly, monthly and all-time rankings, sortable by map size, hints, average time and average score. Your own row is pinned if you have scores. Score = <code>round(10000 / seconds)</code>.</p>
    </td>
    <td width="50%" valign="top">
      <h3 align="center">Account security</h3>
      <img src="docs/media/security.gif" alt="Enabling TOTP 2FA and reviewing active sessions">
      <p>Email verification, password reset, Google and GitHub sign-in (link/unlink), TOTP two-factor auth with QR code, and a session list by device / OS / browser with "sign out others".</p>
    </td>
  </tr>
</table>

<details>
<summary><strong>Everything else</strong></summary>

- **Guest mode** — random display name, full play experience, no account required.
- **Reviews** — 1–5 rating and a comment per user.
- **Profile** — username, avatar upload, password change, email change with confirmation link and cooldown.
- **Session epoch** — changing the password or "sign out all" invalidates every other cookie at once.
- **Mobile-first UI** — responsive layout, touch drawing, safe-area aware modals.
- **OpenAPI** — Swagger UI is served by the backend at `/swagger-ui.html`.
- **Health** — `/actuator/health` with details, used by Compose healthchecks and the deploy step.

</details>

## Architecture

<p align="center">
  <img src="docs/media/diagram.png" alt="NumberLink architecture: client pages, game/share/score APIs, identity services, persistence and integrations" width="900">
</p>

Four Compose services behind one origin:

| Service | Image | Port | Role |
|---|---|---|---|
| `nginx` | nginx | **8090** | Single public entry point. Routes `/api`, `/oauth2`, `/login`, `/uploads`, `/actuator`, `/swagger-ui` to the backend, everything else to the frontend. Forwards `X-Forwarded-Proto` from the upstream TLS proxy. |
| `backend` | Java 21 · Spring Boot 4 | 8000 | REST API, puzzle engine, auth, mail, uploads. Flyway migrates the schema on start (`ddl-auto=validate`). |
| `frontend` | Node 20 · Vite 8 | 7000 | Vanilla JS + Bootstrap 5. `src/` is bind-mounted, so UI edits reload without a rebuild. |
| `db` | PostgreSQL 18 | 5432 (internal) | Local development only, not published on the host. Persistent volume `pgdata`. In production this is replaced by Amazon RDS (see [Production](#production)). |

Startup order is enforced with healthchecks: `db` → `backend` → `frontend` → `nginx`.

<details>
<summary><strong>Tech stack</strong></summary>

**Backend** — Java 21, Spring Boot 4 (Web MVC, Data JPA, Security, OAuth2 Client, Mail, Validation, Actuator), Flyway, Lombok, springdoc-openapi, ZXing (TOTP QR codes), Datafaker (guest names).
**Tests** — JUnit 5, Mockito, Spring Security Test, Testcontainers (PostgreSQL). Unit tests for the puzzle engine (`CreateMap`, `FillMap`, `ShuffleMap`, `CheckSolution`, …) and controller tests for every REST surface.
**Frontend** — Vite 8, vanilla ES modules, Bootstrap 5, Material Web components for selects. No framework.
**Infra** — Docker Compose, nginx reverse proxy, Cloudflare (DNS, TLS, proxy), AWS EC2 (app host) and Amazon RDS for PostgreSQL, GitHub Actions (backend tests → frontend build → SSH deploy to EC2).

</details>

## Quick start

Requirements: Docker with Compose v2. Ports **8090**, **8000** and **7000** should be free.

```bash
git clone https://github.com/ivanstavytskyi/numberlink.git
cd numberlink
cp .env.example .env
docker compose up -d --build
```

Open **http://localhost:8090** and play. The defaults in `.env.example` are enough for guest play and local email + password accounts.

| URL | What |
|---|---|
| http://localhost:8090 | Game (through nginx, same origin as the API) |
| http://localhost:8090/swagger-ui.html | Swagger UI |
| http://localhost:8090/actuator/health | Health with DB details |
| http://localhost:7000 / http://localhost:8000 | Frontend / API directly, bypassing nginx |

<details>
<summary><strong>Day-to-day commands</strong></summary>

```bash
docker compose logs -f backend                 # follow API logs
docker compose up -d --build backend           # rebuild after Java changes
docker compose exec db psql -U "$DB_USER" -d "$DB_NAME"
docker compose down                            # stop, keep the database
docker compose down -v                         # stop and wipe Postgres
```

Frontend changes under `frontend/src/` hot-reload. Backend changes need a rebuild; the image runs `gradlew build -x test`.

Run the backend test suite locally (needs Docker for Testcontainers):

```bash
cd backend && ./gradlew test
```

</details>

## Configuration

`.env` is gitignored — copy `.env.example`. Leave the OAuth and SMTP blocks empty if you don't need them: local registration still works, but verification mail, password reset and Google/GitHub sign-in will not until they are filled in.

| Variable | Purpose |
|---|---|
| `DB_URL`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection. `DB_URL` is `db:5432` locally and the RDS endpoint in production |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Sign in / link Google |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Sign in / link GitHub |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM` | Verification, reset and email-change mail |
| `SMTP_STARTTLS`, `SMTP_SSL` | Port 587 → `true`/`false`; port 465 → `false`/`true` |
| `FRONTEND_BASE_URL`, `BACKEND_BASE_URL` | Public URLs used in OAuth redirects and email links |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | Comma-separated allowlist; include your production domain |
| `VITE_ALLOWED_HOSTS` | Vite host check for production domains |
| `UPLOADS_DIR`, `AVATAR_MAX_BYTES` | Avatar storage (defaults: `uploads`, 7 MB) |

OAuth apps must redirect to the **backend**, not the Vite port:

- `${BACKEND_BASE_URL}/login/oauth2/code/google`
- `${BACKEND_BASE_URL}/login/oauth2/code/github`

After a successful OAuth login the API sends the browser back to `${FRONTEND_BASE_URL}/`.

## API overview

Cookie-based sessions; every state-changing call needs a logged-in user unless noted. Full contract in Swagger UI.

<details>
<summary><strong>Endpoints</strong></summary>

| Area | Endpoints |
|---|---|
| Game | `GET /api/create-map` · `POST /api/map-check` · `POST /api/hint-check` · `GET /api/width` · `GET /api/height` |
| Scores | `POST /api/score` · `GET /api/score` (your best) · `GET /api/score/sort` (leaderboard) · `GET /api/score/history` |
| Share | `POST /api/share/generate` · `POST /api/share/revoke` · `GET /api/search/{token}` (public) |
| Reviews | `POST /api/rating` · `GET /api/rating/avg` · `/amount` · `/percentage` · `/comments` |
| Auth | `POST /api/register` · `/login` · `/login/2fa` · `/logout` · `/verify-email` · `/resend-verification` · `/forgot-password` · `/reset-password` · `GET /api/me` · `GET /api/generate-name` |
| Profile | `PUT /api/me/profile` · `PUT /api/me/password` · `PUT/DELETE /api/me/avatar` |
| Email change | `POST /api/me/email-change` · `/confirm` · `/resend` · `/cancel` |
| OAuth links | `POST /api/me/oauth/prepare-link` · `DELETE /api/me/oauth/{provider}` · `GET /oauth2/authorization/{provider}` |
| 2FA | `POST /api/me/2fa/setup` · `DELETE /api/me/2fa/setup` · `POST /api/me/2fa/confirm` · `POST /api/me/2fa/disable` |
| Sessions | `GET /api/me/sessions` · `DELETE /api/me/sessions/{id}` (one) · `DELETE /api/me/sessions` (all others) |

</details>

## Repository layout

```text
numberlink/
├── .github/workflows/ci.yml   backend tests → frontend build → SSH deploy to EC2 on main
├── LICENSE                    MIT
├── docker-compose.yml         nginx · backend · frontend · db (db is local-only; prod uses RDS)
├── docker/                    Dockerfiles + nginx config
├── backend/                   Spring Boot (Gradle); Flyway under src/main/resources/db/migration (V1–V14)
├── frontend/                  Vite, root = src/
│   └── src/
│       ├── index.html         Play
│       ├── leaderboard/       Weekly / monthly / all-time rankings
│       ├── history/           Your games, stats, share
│       ├── reviews/           Ratings and comments
│       ├── faqs/              Static FAQ
│       ├── verify/            Email-confirmation landing page
│       └── shared/            Auth UI, settings panel, share modal, nav, API helpers
├── postgres/                  schema.sql for a brand-new volume; Flyway owns later changes
└── docs/media/                Architecture diagram, GIFs and screenshots used in this README
```

## Production

The public instance at [numberlink.fly-stack.com](https://numberlink.fly-stack.com) runs on AWS behind Cloudflare:

```text
Browser
  │  HTTPS
  ▼
Cloudflare ─── DNS · TLS termination · proxy / WAF · caching
  │  HTTPS → EC2 :8090
  ▼
AWS EC2 ─── Docker Compose: nginx → backend (Spring Boot) · frontend (Vite)
  │  5432 (private VPC)
  ▼
Amazon RDS for PostgreSQL 18 ─── managed backups, storage, patching
```

- **Cloudflare** owns the domain: DNS, edge TLS certificate and proxying. nginx maps the incoming `X-Forwarded-Proto` so Spring builds correct `https://` redirect and cookie attributes (`server.forward-headers-strategy=framework`).
- **EC2** hosts the three app containers. The `db` service from Compose is **not** started there; `DB_URL` points to the RDS endpoint instead.
- **RDS** is the only stateful piece besides avatar uploads on the EC2 disk. Flyway applies migrations against it on every backend start.

<table>
  <tr>
    <td width="50%" valign="top">
      <h4 align="center">Cloudflare</h4>
      <img src="docs/media/infra-cloudflare.png" alt="Cloudflare DNS records for fly-stack.com with proxied A and CNAME entries">
      <p align="center"><sub>A and CNAME records for the site are proxied through Cloudflare (orange cloud); mail records are DNS-only.</sub></p>
    </td>
    <td width="50%" valign="top">
      <h4 align="center">AWS</h4>
      <img src="docs/media/infra-aws.png" alt="EC2 instance and RDS PostgreSQL instance in the AWS console">
      <p align="center"><sub>EC2 instance running Compose and an RDS PostgreSQL instance, both in <code>eu-central-1</code>.</sub></p>
    </td>
  </tr>
</table>

### Continuous deployment

Pushing to `main` runs the backend tests and the frontend build in GitHub Actions; if both pass, the workflow SSHes into the EC2 instance, pulls `main`, runs `docker compose up -d --build nginx backend frontend` and waits for `/actuator/health` on port 8090.

<p align="center">
  <img src="docs/media/deploy.gif" alt="GitHub Actions run: backend tests, frontend build, deploy to EC2" width="800">
</p>

To host your own copy, point `DB_URL` at your database, put a TLS-terminating proxy in front of 8090, and set `FRONTEND_BASE_URL`, `BACKEND_BASE_URL`, `CORS_ALLOWED_ORIGIN_PATTERNS` and `VITE_ALLOWED_HOSTS` to your domain.

## Contributing

Issues and pull requests are welcome. Keep migrations additive (new `V{n}__*.sql`, never edit an applied one), run `./gradlew test` before opening a PR, and match the existing commit style (`feat(frontend): …`, `fix(backend): …`).

## License

[MIT](LICENSE) © Ivan Stavytskyi. The bundled [Nunito](frontend/src/public/assets/fonts/Nunito) typeface is licensed separately under the [SIL Open Font License](frontend/src/public/assets/fonts/Nunito/OFL.txt).
