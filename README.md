# Wexa — FRTB Counterparty Contagion Simulator

Visualize and simulate how a single counterparty default ripples through a financial trading network via direct exposure, shared collateral pools, and ownership structures—complex relationship topologies that relational databases cannot express cleanly.

---

## Architecture & Tech Stack

### Backend
- **Runtime**: Node.js (ESM) with TypeScript
- **Framework**: Express 5
- **Database**: CognoDB (Neo4j-compatible Graph Database) via native `neo4j-driver` (Bolt Protocol)
- **Validation**: Zod (Schema-based runtime request validation for params, query, and body)
- **Logging**: Winston structured JSON/colorized logging with Morgan HTTP request integration
- **Reliability & Lifecycle**: Graceful shutdown manager with signal trapping (`SIGTERM`, `SIGINT`), resource pooling, and connection timeout management.

---

## Architectural Decisions

### Data Layer: Raw Parameterized Cypher over OGM / Query Builder Abstraction
Writing raw parameterized Cypher directly via the official `neo4j-driver` is a deliberate design choice:
- **Transparency & Control**: Graph traversals, pattern matches, and aggregations remain explicit and easy to optimize without an ORM/OGM layer obscuring execution plans.
- **Simplicity & Performance**: Avoids unnecessary abstraction overhead while leveraging native Cypher execution plan caching through `$param` bindings.
- **Query Isolation**: Each Cypher query is encapsulated in its own named repository function (`src/repo/network.repo.ts`), fully parameterized, and documented with its graph traversal rationale.

### Resilient Graph Database Driver Lifecycle
- Connection pooling with health pings on startup (`RETURN 1`) to fail fast if credentials or connectivity are degraded.
- Clean session scope management with `withSession` wrappers to guarantee session disposal and avoid socket leaks.
- Zero credential leakage: all errors are mapped to sanitized client-safe responses via centralized error handling middleware.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/network` | Returns full force-directed graph view (all institutions, collateral pools, and relationships). |
| `GET` | `/api/institutions/:id` | Returns details, status, tier, and direct relationships for a specific institution. |
| `POST` | `/api/simulate-default` | Runs variable-length traversal (`*1..5`) outward from a defaulted node across `TRADES_WITH` and `POSTS_COLLATERAL` relationships to compute downstream contagion and hop distances. |
| `GET` | `/api/path?from=X&to=Y` | Computes the shortest contagion path (`*1..5`) connecting an affected institution back to the defaulted source institution. |
| `GET` | `/api/health` | Diagnostic health check verifying Express runtime and CognoDB database connectivity. |

---

## Local Development & Setup

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Server Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env # or configure COGNODB_URI, COGNODB_USERNAME, COGNODB_PASSWORD

# Start development server with hot-reload
npm run dev

# Build and start production bundle
npm run build
npm start
```
