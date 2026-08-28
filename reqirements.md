Functional Requirements

FR1 — Network visualization

Display all institutions as nodes in an interactive graph view (force-directed layout)
Color-code nodes by health status: Healthy / Stressed / Defaulted
Edge types visually distinguished: TRADES_WITH, POSTS_COLLATERAL, OWNED_BY

FR2 — Institution detail

Click any node → side panel shows: name, type, tier, total direct exposure, list of direct relationships

FR3 — Default simulation (core feature)

User selects an institution and triggers "Simulate Default"
App runs a variable-length traversal (*1..5) outward from that node across TRADES_WITH and POSTS_COLLATERAL relationships
All reachable institutions highlight on the graph, visually distinguished by hop-distance (degree of separation)
A ranked side list shows affected institutions ordered by proximity/exposure

FR4 — Path explanation

Click any highlighted (affected) node → show the actual chain of relationships connecting it back to the defaulted institution (the traversal path, not just the fact that it's connected)

FR6 — Seed data loading

A script to load realistic seed data (30–50 institutions, a handful of collateral pools, ownership clusters) into CognoDB, idempotent via MERGE

FR7 — Empty/loading/error states

Loading state while traversal query runs
Empty state if an institution has no downstream contagion (e.g., isolated node)
Clear error state if the DB is unreachable




Non-Functional Requirements

NFR1 — Security

CognoDB URI and password read from environment variables only, never committed
All Cypher queries parameterized ($param), no string concatenation — enforced everywhere, not just as a nice-to-have

NFR2 — Reliability

Graceful degradation if CognoDB is unreachable (frontend shows a clear error, backend doesn't crash)
Idempotent seed script (safe to re-run via MERGE)

NFR3 — Performance

Traversal queries capped at a sensible depth (*1..5) to avoid runaway query cost on the free tier (256MB RAM, burstable 0.5 vCPU)
Seed data sized to stay well within free-tier limits (a few hundred to a few thousand nodes/edges is more than enough — you don't need to max this out)

NFR4 — Usability

Non-technical user should be able to pick an institution and understand the blast radius without reading documentation
Readable typography, sensible layout — explicitly graded per the assignment

NFR5 — Maintainability

Clear separation: API layer (Express routes) / data access layer (Cypher queries + driver) / frontend (React)
TypeScript types shared or mirrored between backend response shapes and frontend consumption where practical

NFR6 — Documentation

README includes: use-case explanation, "why graph database" argument, data model diagram, setup instructions (including CognoDB instance creation), explanation of the 2-3 main queries, screenshots

NFR7 — Deployability

Must be hosted on a free tier somewhere (Vercel/Render/Railway for frontend+backend); CognoDB instance kept alive until Wexa re