wexa take home assignment

FRTB counterparty contagion simulator

Visualize and simulate how a single counterparty default ripples through a bank's trading network via direct exposure, shared collateral, and hidden ownership something a relational schema can't express cleanly.

## Architectural Decisions

### Data Layer: Raw Parameterized Cypher over OGM / Query Builder Abstraction
At this scale, writing raw parameterized Cypher directly via the official `neo4j-driver` is a deliberate design choice rather than an oversight:
- **Transparency & Control**: Graph traversals, pattern matches, and aggregations remain explicit and easy to optimize without an ORM/OGM layer obscuring execution plans.
- **Simplicity & Performance**: Avoids unnecessary abstraction overhead while leveraging native Cypher execution plan caching through `$param` bindings.
- **Query Isolation**: Each Cypher query is encapsulated in its own named repository/service function, fully parameterized, and documented with its graph traversal rationale.

