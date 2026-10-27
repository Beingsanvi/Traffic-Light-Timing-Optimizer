# SmartFlow API documentation

Base URL: `http://localhost:3000/api`. The frontend and API are served by the same Express application. Read this document at `/api-docs` while the server is running.

**Postman:** Import [the ready-to-use collection](../SmartFlow.postman_collection.json), or use the [copy-paste URLs and request bodies](POSTMAN.md).

## Authentication and conventions

- Send JSON request bodies with `Content-Type: application/json`.
- Sign up, then log in. Login sets the `smartflow_session` HttpOnly cookie; include it on subsequent requests. No MongoDB credentials belong in API requests or browser code.
- All traffic, dashboard, analytics, and event endpoints require a logged-in user. All registered users are operators in this prototype.
- Sessions expire after one day, or 30 days when login includes `remember: true`. Logout revokes the session in MongoDB.
- Browser mutations must be same-origin. HTTPS is required when `NODE_ENV=production` because session cookies are marked Secure. Behind a reverse proxy, configure `TRUST_PROXY` to the exact trusted hop count (usually `1`) so Express recognizes the original protocol and client IP.
- Authentication endpoints allow 30 attempts per IP per 15 minutes.
- Intersection keys: `central`, `market`, `park`, `main` (display IDs `001`–`004`).
- Dates are ISO 8601 UTC strings. Counts and durations are numbers; durations are seconds.

## Endpoints

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| GET | `/health` | MongoDB connection readiness (public) | 200 |
| POST | `/auth/signup` | Create an operator account (public) | 201 |
| POST | `/auth/login` | Verify credentials and set session cookie (public) | 200 |
| GET | `/auth/me` | Get current operator | 200 |
| POST | `/auth/logout` | Revoke current session (idempotent) | 204 |
| GET | `/dashboard` | Central intersection, network, and 10 latest events | 200 |
| GET | `/intersections` | All four intersections | 200 |
| GET | `/intersections/:key` | One intersection | 200 |
| PATCH | `/intersections/:key/traffic` | Record directional traffic and recalculate metrics | 200 |
| POST | `/intersections/:key/optimize` | Apply optimized timing; record an audit event | 200 |
| GET | `/analytics` | Stored history, summary, insights, and performance | 200 |
| GET | `/events` | Recent activity | 200 |

### Health

```json
{ "status": "ok", "database": "connected" }
```

Returns 503 if the database connection is unavailable. Startup requires a successful database connection.

### Signup

`POST /auth/signup`

```json
{ "name": "Traffic Operator", "email": "operator@example.com", "password": "example-password" }
```

Name: 1–100 characters after trimming. Email is trimmed and lowercased, valid, unique, and at most 254 characters. Password: at least 6 characters, at most 72 UTF-8 bytes. Passwords are stored as bcrypt hashes. Unknown body fields are rejected.

Response (also the response shape for login and `/auth/me`):

```json
{ "user": { "id": "<MongoDB ObjectId>", "name": "Traffic Operator", "email": "operator@example.com" } }
```

Signup does not log the user in. Duplicate email returns 409. Browser-only prototype accounts must be registered again.

### Login and logout

`POST /auth/login`

```json
{ "email": "operator@example.com", "password": "example-password", "remember": false }
```

`remember` is optional. Invalid credentials return 401. Login rotates the current session. `POST /auth/logout` accepts `{}` and returns an empty 204 response.

### Intersection state

`GET /intersections` returns `{ "intersections": [...] }`. `GET /intersections/central`, traffic update, and optimization return `{ "intersection": {...} }`.

Example state (calculated from the initial central traffic counts):

```json
{
  "intersection": {
    "key": "central",
    "id": "001",
    "name": "Central Ave × 5th",
    "north": 25,
    "south": 20,
    "east": 35,
    "west": 30,
    "density": 34,
    "vehiclesPerHour": 1980,
    "waitTime": 23,
    "optimizationScore": 92,
    "baselineScore": 92,
    "currentGreenTime": 37,
    "recommendedGreenTime": 37,
    "currentPhase": "NS",
    "signalStage": "GREEN",
    "signalCountdown": 37,
    "nextPhase": "EW",
    "status": "OPTIMAL",
    "decision": {
      "priority": "EAST / WEST",
      "phase": "EW",
      "difference": 18,
      "recommendedGreenTime": 37,
      "estimatedWaitReduction": 14
    }
  }
}
```

State also includes `createdAt`, `updatedAt`, and `lastTickAt`. `status` is `HIGH LOAD` at density ≥80, `MONITOR` at ≥60, otherwise `OPTIMAL`. Signals use `NS`/`EW` and `GREEN`/`YELLOW` stages. Server polling supplies the countdown; the frontend does not run a separate signal controller.

### Update traffic

`PATCH /intersections/central/traffic`

```json
{ "north": 40, "south": 35, "east": 20, "west": 25 }
```

All four fields are required integer counts from 0 to 80. The server recalculates metrics, stores a snapshot, and records a `traffic_updated` event. With simulation enabled, the next simulation tick can change these counts. Set `SIMULATION_ENABLED=false` for manual traffic input; signal cycling and historical recording continue.

### Optimize

`POST /intersections/central/optimize` with `{}` (or an empty body).

Calculates green time as `clamp(round(20 + max(NS load, EW load) × 0.25), 20, 60)` and chooses the direction with greater demand. A direction change passes through a three-second yellow stage. The response is the persisted intersection state; an `optimized` event stores the actor, previous timing, target timing, and estimated reduction. Normal cycles alternate directions to avoid indefinite starvation.

### Dashboard

`GET /dashboard`

```json
{ "traffic": { "key": "central" }, "intersections": [], "events": [] }
```

`traffic` and each item of `intersections` have the full state described above. Events use the format below. The dashboard polls every second.

### Analytics

`GET /analytics?metric=density&intersection=all&seconds=300`

| Query | Allowed values | Default |
| --- | --- | --- |
| `metric` | `density`, `wait`, `vehicles`, `score` | `density` |
| `intersection` | `all`, `central`, `market`, `park`, `main` | `all` |
| `seconds` | Integer 1–3600 | 30 |

```json
{
  "metric": "density",
  "intersection": "all",
  "seconds": 300,
  "points": [{ "time": "2026-10-27T10:00:00.000Z", "value": 49 }],
  "summary": { "current": 49, "average": 49, "peak": 49, "trend": "STABLE" },
  "insights": {
    "busiestIntersection": "Main St × 2nd",
    "peakLoad": 75,
    "priority": "EAST / WEST",
    "condition": "Moderate traffic detected"
  },
  "intersections": [],
  "performance": { "baseline": 92, "current": 92, "improvement": 0 }
}
```

Example values are illustrative. `intersections` contains all full intersection states. For `all`, density, wait, and score are averages; vehicle flow is the sum. Historical points group snapshots by timestamp and carry forward the last recorded value of each intersection for partial API updates. Network history begins once every intersection has an observation. Summary current values come from live persisted state; average and peak come from the selected historical window, falling back to current if there are no observations. Trend compares the last five observations (threshold 40 for vehicles, 2 for other metrics) and is `RISING`, `FALLING`, or `STABLE`.

Performance compares current score with each intersection's stored initialization baseline. `improvement` is **percentage points**, not measured wait reduction. Traffic metrics and estimated wait reduction are demonstration heuristics, not measurements from real road sensors. History survives page reloads and is retained for 30 days. The UI polls every three seconds; pausing freezes the displayed data while server collection continues.

### Events

`GET /events?intersection=central&limit=20`

Optional `intersection` filters by key. `limit` is 1–100 (default 20). Most recent first.

```json
{
  "events": [{
    "_id": "<MongoDB ObjectId>",
    "type": "optimized",
    "intersection": "central",
    "message": "Central Ave × 5th: optimized to 36s (EAST / WEST)",
    "actor": "<user ObjectId>",
    "details": {
      "before": { "phase": "NS", "greenTime": 37, "score": 92 },
      "greenTime": 36,
      "phase": "EW",
      "estimatedWaitReduction": 14
    },
    "createdAt": "2026-10-27T10:00:00.000Z"
  }]
}
```

Types: `initialized`, `traffic_updated`, `optimized`. `actor` and `details` are optional.

## Errors

```json
{ "error": { "message": "Invalid request", "details": [{ "path": "north", "message": "Too big: expected number to be <=80" }] } }
```

`details` is present for request validation failures. Status codes: 400 invalid input/JSON, 401 missing/expired session or invalid credentials, 403 cross-origin mutation, 404 missing route/intersection, 409 duplicate email, 413 body over 16 KB, 429 authentication rate limit, 500 server/database failure, 503 database unavailable at health check. Invalid intersection key values return 400.

## cURL walkthrough

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Operator","email":"operator@example.com","password":"example-password"}'

curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"operator@example.com","password":"example-password"}'

curl -b cookies.txt http://localhost:3000/api/dashboard

curl -b cookies.txt -X POST http://localhost:3000/api/intersections/central/optimize \
  -H 'Content-Type: application/json' -d '{}'

curl -b cookies.txt 'http://localhost:3000/api/analytics?metric=wait&intersection=central&seconds=300'

curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```
