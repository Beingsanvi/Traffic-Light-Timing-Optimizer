# MongoDB database

Default database: `smartflow`, configurable with `MONGO_DB_NAME`. The URI is loaded server-side from the existing `MONGO_DB_URL` environment variable; `MONGODB_URI` is also accepted. MongoDB uses **collections and documents** rather than SQL tables and rows.

Run `npm run db:init` to create the collections and indexes and seed the four intersections. Startup also performs this initialization. It is idempotent: existing accounts, traffic, baselines, and events are preserved. The database becomes visible in Atlas after the first successful writes.

## Collections

| Collection | Fields | Indexes |
| --- | --- | --- |
| `users` | name, email, passwordHash, createdAt, updatedAt | Unique email |
| `sessions` | tokenHash, user → users._id, expiresAt, timestamps | Unique tokenHash; expiresAt TTL |
| `intersections` | key, id, name, directional counts, density, vehiclesPerHour, waitTime, optimizationScore, baselineScore, currentGreenTime, recommendedGreenTime, currentPhase, signalStage, signalCountdown, nextPhase, lastTickAt, timestamps | Unique key and display id |
| `trafficsnapshots` | intersection → intersections.key, timestamp, density, waitTime, vehiclesPerHour, optimizationScore | (intersection, timestamp descending); timestamp TTL (30 days) |
| `events` | type, intersection → intersections.key, message, actor → users._id, optional details, createdAt | createdAt descending; (intersection, createdAt descending) |

Mongoose schemas and application validation are defined in `server/models.js` and `server/app.js`. References are application-managed; MongoDB does not enforce SQL foreign keys. Mongoose validates document writes; direct database writes should use the same constraints.

## Seed network

| Key | Display ID | Name | N / S / E / W |
| --- | --- | --- | --- |
| central | 001 | Central Ave × 5th | 25 / 20 / 35 / 30 |
| market | 002 | Market St × 3rd | 40 / 35 / 55 / 45 |
| park | 003 | Park Ave × 8th | 20 / 25 / 30 / 25 |
| main | 004 | Main St × 2nd | 60 / 55 / 65 / 60 |

Directional counts are integer values from 0 to 80. Density is `round(total / 320 × 100)`, flow is `total × 18`, wait is `round(8 + density × 0.45)`, score is `clamp(round(100 − abs(NS − EW) × 0.4), 45, 98)`. Normal recommended green duration is `clamp(round(25 + density × 0.35), 20, 60)`. These shared server formulas keep dashboard and analytics consistent.

## Runtime

- One Express process owns the traffic simulation and signal clock. API traffic updates and optimizer actions are serialized with ticks to avoid overlapping writes within that process.
- Signal state is persisted roughly every second; traffic is simulated and historical snapshots are recorded every three ticks. The next tick is scheduled after the previous tick finishes, so slow databases can extend the sampling interval.
- Normal green phases alternate between NS and EW, with a three-second yellow transition. Explicit optimization may select the higher-demand direction.
- `SIMULATION_ENABLED=false` disables random traffic changes but keeps signal cycling and snapshot recording.
- Run a **single server instance** for this prototype. Multiple replicas require a separately coordinated simulation worker/distributed locking.
- State, snapshot, and event writes are separate operations, not a multi-document transaction. A database interruption can leave a missing snapshot/event; successful state writes remain persisted.
- TTL cleanup is asynchronous; authentication checks expiry immediately even before MongoDB removes the expired session document.
- User passwords are bcrypt hashes; session tokens are cryptographically random and only SHA-256 hashes are stored in MongoDB.

## Atlas setup

Use the existing connection URI or copy `.env.example` to `.env` and fill in your Atlas driver's URI. The database user must have read/write permissions and permission to create collections/indexes for this database. Allow the server's IP in Atlas Network Access. URL-encode special characters in URI usernames/passwords. An Atlas management API key alone does not authenticate a MongoDB driver connection.

`.env` is ignored by Git and never served by Express. Static files are restricted to the public HTML pages and Assets/Css/Js directories.

## Connection troubleshooting

Passwords containing reserved characters must be URL-encoded **inside the URI**. For example, a password beginning with `@` must begin with `%40` in the connection string. Keep the actual Atlas password unchanged. An unescaped `@` can make the driver query part of the password as the hostname and report `ENOTFOUND`, even when the cluster hostname is correct. SmartFlow checks for repeated raw `@` separators before connecting and reports an actionable error without printing credentials.

If initialization reports `ENOTFOUND` with an Atlas `mongodb+srv://` URI, the cluster's DNS SRV record could not be resolved. Copy the current connection string from Atlas **Connect → Drivers**, confirm the cluster is active and the hostname is correct, update `MONGO_DB_URL` in `.env`, and run `npm run db:init` again. For authentication failures, check the database user's credentials and permissions; for connection timeouts, check Atlas Network Access and the server's network connectivity.

If DNS works and the connection reports an Atlas TLS handshake failure (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`), confirm that your current public IP is included in **Atlas → Security → Network Access** and that its entry is active. This error can also occur with VPN/firewall TLS interference. After updating access, rerun `npm run db:init`. TLS certificate verification remains enabled.
