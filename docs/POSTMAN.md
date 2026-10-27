# Testing SmartFlow in Postman

## Import the collection

1. Start the backend with `npm start`. MongoDB must be reachable; if startup reports `ENOTFOUND`, update `MONGO_DB_URL` in `.env` using your current Atlas connection string.
2. In Postman, click **Import → Files** and select [`SmartFlow.postman_collection.json`](../SmartFlow.postman_collection.json) from the project root folder.
3. Open the **SmartFlow API** collection's **Variables** tab. `baseUrl` defaults to `http://localhost:3000/api`. Sample account credentials are already supplied; change `email` and `password` if needed.
4. Send **Health → Signup → Login → Current User**, then test Dashboard, Intersections, Analytics, and Events. Send **Logout** last.

Postman automatically stores the login session cookie and sends it with later requests. Keep its cookie jar enabled and use the same hostname for all requests (`localhost` and `127.0.0.1` have different cookie jars). The collection uses **No Auth**; no Bearer token is required. A 401 on protected requests means you need to log in again.

The collection includes response-status checks. Repeated Signup requests may return 409 (email already registered); use Login with the same credentials. You can also run the whole collection in its listed order with the Collection Runner.

## Copy-paste endpoints

Select the method in Postman and paste the URL. For POST/PATCH requests, select **Body → raw → JSON** and use the matching body below.

| Method | URL |
| --- | --- |
| GET | `http://localhost:3000/api/health` |
| POST | `http://localhost:3000/api/auth/signup` |
| POST | `http://localhost:3000/api/auth/login` |
| GET | `http://localhost:3000/api/auth/me` |
| GET | `http://localhost:3000/api/dashboard` |
| GET | `http://localhost:3000/api/intersections` |
| GET | `http://localhost:3000/api/intersections/central` |
| PATCH | `http://localhost:3000/api/intersections/central/traffic` |
| POST | `http://localhost:3000/api/intersections/central/optimize` |
| GET | `http://localhost:3000/api/analytics?metric=density&intersection=all&seconds=300` |
| GET | `http://localhost:3000/api/analytics?metric=wait&intersection=central&seconds=300` |
| GET | `http://localhost:3000/api/events?limit=20` |
| GET | `http://localhost:3000/api/events?intersection=central&limit=20` |
| POST | `http://localhost:3000/api/auth/logout` |

Replace `central` with `market`, `park`, or `main` to test another intersection. Analytics metrics: `density`, `wait`, `vehicles`, `score`. The time window `seconds` accepts 1–3600.

### Signup body

```json
{
  "name": "Postman Operator",
  "email": "postman.operator@example.com",
  "password": "postman-test-password"
}
```

### Login body

```json
{
  "email": "postman.operator@example.com",
  "password": "postman-test-password",
  "remember": false
}
```

### Update traffic body

```json
{
  "north": 40,
  "south": 35,
  "east": 20,
  "west": 25
}
```

All four counts must be integers from 0 to 80. This request changes the stored traffic data. To keep those values stable while testing, set `SIMULATION_ENABLED=false` in `.env` and restart the server.

### Optimize / Logout body

```json
{}
```

Full response formats and validation rules are in [API.md](API.md).
