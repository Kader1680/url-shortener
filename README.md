# Shortly URL Shortener (Express + PostgreSQL + Next.js)

Shortly is a full-stack link shortening service. It lets anyone paste a long URL and get a short one back instantly, and it lets registered users manage their links from a dashboard, disable or delete them, and see click analytics (browser breakdown, recent activity, daily totals).

I built this as a complete, production-style example of a small backend service: a REST API with real authentication, a normalized PostgreSQL schema, rate limiting, and a thin Next.js frontend that consumes the API like any other client would. There's no ORM magic hiding what's going on — the data layer is plain SQL through `pg`, so it's easy to read exactly what every endpoint does to the database.

## Diagram Explination for Project 

<img src="/images/diagram.png" width="500" />

## Why this project exists

Most "URL shortener" tutorials stop at `INSERT` and `redirect`. This one goes a bit further because that's the part that's actually interesting from a backend standpoint:

- Short codes are generated with `nanoid`, with collision checking and support for user-chosen custom codes.
- Clicks are logged asynchronously (the redirect doesn't wait on an analytics insert), and parsed for browser/OS from the user agent.
- Links can be scoped to a logged-in user, or created anonymously (no account required to get a short link, same as the real products this is modeled after).
- Auth is hand-rolled with bcrypt + JWT rather than a library that hides the whole flow — because that flow is exactly what shows up in interviews.
- Rate limiting is split between a general API limiter and a stricter one on auth routes, since brute-forcing login attempts is a realistic threat for an app like this.

## Tech stack

**Backend:** Node.js, Express, PostgreSQL (raw SQL via `pg`), bcryptjs, jsonwebtoken, express-rate-limit, helmet, morgan, nanoid

**Frontend:** Next.js 14 (App Router), plain CSS, no component library — kept intentionally light so the API is the star of the project

## Project structure

```
url-shortener/
├── backend/
│   ├── server.js                  entry point, boots the DB check + HTTP server
│   ├── src/
│   │   ├── app.js                 express app, middleware wiring, route mounting
│   │   ├── config/db.js           pg connection pool
│   │   ├── controllers/           request handlers (auth, url shortening/redirect/stats)
│   │   ├── models/                SQL queries, one file per table
│   │   ├── middleware/            auth guard, rate limiters, error handler
│   │   ├── routes/                express routers
│   │   ├── utils/                 jwt signing, short code generation, async wrapper
│   │   └── migrations/            SQL schema + a tiny runner script
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.js                 home page — shorten form, works logged out
    │   ├── login/, register/       auth pages
    │   └── dashboard/              link list, toggle/delete, click stats
    ├── lib/api.js                  fetch wrapper + token storage
    └── .env.example
```

## Database schema

Three tables, nothing fancier than it needs to be:

- **users** — name, email (unique), bcrypt password hash
- **urls** — belongs to a user (nullable, for anonymous links), short_code (unique), original_url, active flag, optional expiry, denormalized click_count for fast dashboard reads
- **clicks** — one row per redirect: url_id, ip, user agent, parsed browser/OS, referrer, timestamp

`click_count` on `urls` is intentionally denormalized so the dashboard list doesn't need to `COUNT()` across the clicks table for every row. The detailed stats endpoint still queries `clicks` directly for the breakdowns.

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally or reachable via a connection string

### 1. Set up the database

```bash
createdb shortly
```

(Or point `DATABASE_URL` at whatever Postgres instance you already have   Supabase, Railway, RDS, a Docker container, doesn't matter.)

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and JWT_SECRET
npm install
npm run migrate      
npm run dev         
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          
```

Open `http://localhost:3000` — you can shorten a link straight away without an account, or sign up to get a dashboard with click tracking.

## API reference

All responses are JSON. Authenticated routes expect `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account, returns a JWT |
| POST | `/api/auth/login` | — | Log in, returns a JWT |
| GET | `/api/auth/me` | required | Current user info |
| POST | `/api/urls` | optional | Create a short link (anonymous or attached to the logged-in user) |
| GET | `/api/urls` | required | Paginated list of the current user's links |
| GET | `/api/urls/:id/stats` | required | Click breakdown for one link |
| PATCH | `/api/urls/:id` | required | Enable/disable a link |
| DELETE | `/api/urls/:id` | required | Delete a link |
| GET | `/:code` | — | Resolves a short code and redirects (302) |
| GET | `/health` | — | Uptime check |

Example request:

```bash
curl -X POST http://localhost:5000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "customCode": "gh"}'
```

```json
{
  "id": "a1b2c3...",
  "shortCode": "gh",
  "shortUrl": "http://localhost:5000/gh",
  "originalUrl": "https://github.com",
  "createdAt": "2026-01-14T10:12:00.000Z"
}
```

## Design decisions worth knowing about

- **No ORM.** Prisma/Sequelize are great for velocity, but for a portfolio piece I wanted the SQL visible — it's a better signal of understanding joins, indexes, and transactions than a `.create()` call.
- **Analytics writes don't block the redirect.** The click insert and the click_count bump happen after `res.redirect()` is already in flight conceptually (they're not awaited before responding), so a slow analytics write never adds latency to the one request path that matters most: the actual redirect.
- **Anonymous + authenticated links share one table.** `user_id` is nullable rather than having two separate flows, which keeps the redirect logic — the hottest path in the whole app — completely indifferent to who owns the link.
- **Rate limiting is tiered.** General API traffic gets a generous limit; login/register get a much tighter one, since that's the endpoint someone would actually try to abuse.

## Possible extensions

A few directions this could go if I kept building on it:

- Redis cache in front of the short-code lookup (the redirect path is read-heavy and a perfect cache candidate)
- QR code generation per short link
- Geo lookup on click (currently only browser/OS are parsed from the user agent)
- Link expiration sweeper job instead of checking `expires_at` on read
- Team/workspace support so multiple users can share a pool of links

## License

MIT — do whatever you want with it.
