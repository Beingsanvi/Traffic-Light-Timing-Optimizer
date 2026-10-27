# SmartFlow – Traffic Light Timing Optimizer

SmartFlow monitors a simulated four-intersection network, calculates adaptive signal timings, and displays live traffic and historical analytics.

## Technology

- **Frontend:** HTML, CSS, vanilla JavaScript (forms, API calls, and rendering)
- **Backend:** Node.js 22+, Express 5 (authentication, simulation, signal control, optimization, and analytics)
- **Database:** MongoDB with Mongoose models and indexes
- **Authentication:** bcrypt password hashes and MongoDB-backed HttpOnly sessions

## Run locally

```bash
npm install
npm run db:init
npm start
```

The existing `.env` is read automatically. For a fresh checkout, copy `.env.example` to `.env` and set your MongoDB driver connection URI:

```dotenv
MONGO_DB_URL=mongodb+srv://<database-user>:<password>@<cluster>/smartflow
MONGO_DB_NAME=smartflow
PORT=3000
NODE_ENV=development
SIMULATION_ENABLED=true
```

Open **http://localhost:3000**, create an account, and sign in. `npm run dev` starts Node's watch mode. `npm run db:init` creates the collections, indexes, and four seed intersections; startup also initializes them automatically without resetting existing data. MongoDB credentials stay on the server and `.env` is ignored by Git.

API requests are logged in the server terminal with their method, endpoint, response status, and duration, for example: `GET /api/dashboard 200 12.3 ms`. Restart `npm start` after backend changes, or use `npm run dev` for automatic restarts.

The app must run through Express rather than opening HTML files directly. Existing accounts from the localStorage prototype must be registered again.

## Features

- Persistent operator accounts, login, logout, and remembered sessions
- Server-driven traffic simulation and green/yellow signal transitions
- Directional traffic counts, density, estimated wait, flow, and optimization score
- Optimized timing with persisted actor/activity events
- Central dashboard and a consistent four-intersection network
- MongoDB historical analytics filtered by metric, intersection, and time window
- Pause/resume analytics display and recorded-baseline score comparison

Simulation changes traffic every three ticks; signal state updates roughly every second. Set `SIMULATION_ENABLED=false` to send traffic counts through the API while retaining signal cycling and historical recording. The data and optimization estimates are demonstration heuristics.

## Documentation

- [Postman collection](SmartFlow.postman_collection.json) and [copy-paste testing guide](docs/POSTMAN.md)
- [API reference, endpoints, request/response examples, and cURL walkthrough](docs/API.md)
- [Database collections, indexes, initialization, and traffic formulas](docs/DATABASE.md)
- Running API documentation: **http://localhost:3000/api-docs**
- Database readiness: **http://localhost:3000/api/health**

## Project structure

```text
server/
  app.js           Express routes, authentication, and validation
  config.js        Environment configuration
  database.js      MongoDB connection and initialization
  models.js        Users, sessions, intersections, snapshots, events
  traffic.js       Simulation, signal control, optimizer, analytics
  index.js         Server startup and shutdown
  init-db.js       Database initialization command
Js/                Browser API client and presentation logic
Css/               Stylesheets
Assets/            Images and branding
docs/              API and database documentation
test/              API/database integration tests
*.html             Existing application pages
```

## Verification

```bash
npm run check
npm test
```

Integration tests use an isolated, temporary MongoDB process and do not connect to your Atlas database. The first test run downloads a MongoDB test binary and requires network access.

## Deployment

Deploy on a Node.js-capable host with the MongoDB environment variables configured, run `npm start`, and expose the application's port. Use a **single server instance** because it owns the simulation clock. Production requires HTTPS with `NODE_ENV=production`. Behind a reverse proxy, set `TRUST_PROXY` to its exact trusted hop count (usually `1`). Static-only Netlify hosting cannot run this Express backend; the browser pages now depend on its same-origin API.

## Purpose

An educational prototype demonstrating traffic simulation, adaptive timing, persistent analytics, and a centralized traffic-management interface.
