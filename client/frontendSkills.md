# Financial Network Contagion Simulator — Frontend Engineer Prompt

## Role

You are a senior frontend engineer and product designer building a polished, production-quality **financial network contagion simulation demo**.

Use:

* React
* TypeScript
* Tailwind CSS

The backend APIs already exist. The frontend must consume the APIs rather than inventing mock business logic.

---

# PRODUCT PURPOSE

This application is an interactive demonstration of how:

> **A single counterparty default can ripple through a financial trading network via direct exposure, shared collateral relationships, and the structure of the network.**

The experience should allow a user to:

1. Explore the financial institution network.
2. Select an institution.
3. Understand its direct exposures and relationships.
4. Simulate that institution defaulting.
5. See how the impact propagates outward.
6. Understand the degree of separation between institutions.
7. Select an affected institution.
8. See the exact chain of relationships connecting it to the original default.

This is an **analytical storytelling tool**, not a generic admin dashboard.

---

# CORE UX PRINCIPLE

## Familiar UI. Sophisticated Visualization.

Do NOT build a sci-fi interface.

Do NOT create an experimental navigation system.

Do NOT require the user to learn how the application works.

The user should understand the core workflow almost immediately:

**Explore → Select → Simulate → Investigate → Explain**

The graph is where the visual sophistication should live.

The application chrome, controls, panels, buttons, and information architecture should use familiar patterns.

---

# IMPORTANT DESIGN DIRECTION

The visual style should communicate:

**Financial intelligence + network analysis + controlled simulation**

Desired qualities:

* Precise
* Analytical
* Premium
* Calm
* Trustworthy
* Data-dense but readable
* Technically sophisticated

Avoid:

* Cyberpunk
* Sci-fi HUDs
* Spaceship dashboards
* Neon overload
* Excessive glassmorphism
* Floating cards everywhere
* Constant animations
* Decorative particles
* Futuristic navigation
* Experimental gestures

This should look like a serious **risk-analysis tool**, not a movie interface.

---

# PRIMARY USER JOURNEY

The entire application should naturally guide the user through this story:

### 1. See the network

"These institutions are interconnected."

### 2. Select a counterparty

"What does this institution connect to?"

### 3. Simulate its default

"What happens if this institution fails?"

### 4. Watch the propagation

"Which institutions become affected, and how far away are they?"

### 5. Investigate an affected institution

"Why was this institution affected?"

### 6. Explain the path

"Which exact relationships connected the default to this institution?"

The interface should make this progression obvious.

---

# APPLICATION LAYOUT

Use a conventional application shell.

## Header

Keep the header compact.

Include:

* Application title
* Short contextual description
* Optional network status
* Reset simulation action when simulation is active

Suggested title:

**Financial Network Contagion Simulator**

Suggested subtitle:

**Explore how a counterparty default propagates through interconnected financial institutions.**

Do not use oversized marketing-style hero sections.

This is an application, not a landing page.

---

# MAIN WORKSPACE

Use a two-region layout:

### Left / Center

Large interactive network graph.

### Right

Contextual side panel.

The graph should receive the majority of the screen.

The side panel should remain visually connected to the graph.

---

# DEFAULT APPLICATION STATE

When the application opens:

Show the complete network from:

`GET /api/network`

The graph should immediately render nodes and edges.

Show a small instruction near the graph:

**Select an institution to inspect its exposures or simulate a default.**

Do not show a complicated onboarding flow.

Do not require a tutorial.

---

# API INTEGRATION

Use the existing backend APIs.

## Network

```http
GET /api/network
```

Use this to populate:

* Nodes
* Edges
* Institution network
* Initial force-directed graph

Do not hardcode network data in the frontend.

---

## Institution Details

```http
GET /api/institutions/:id
```

Call when a node is selected.

Display the returned institution information in the side panel.

Expected information includes:

* Name
* Type
* Tier
* Total direct exposure
* Direct relationships

---

## Default Simulation

```http
POST /api/simulate-default
```

Use the selected institution as the simulation origin.

The request must use the backend's existing schema.

Do not reproduce traversal logic in the frontend.

The backend is authoritative for:

* Reachability
* Hop distance
* Affected institutions
* Exposure
* Traversal results

The frontend's responsibility is visualization and interaction.

---

## Path Explanation

```http
GET /api/path?from=X&to=Y
```

When the user selects an affected institution, request the actual path between:

`from = simulated default institution`

and

`to = selected affected institution`

Use the response to render the relationship chain.

Do not infer the path from the graph on the client.

The API response is authoritative.

---

# FR1 — NETWORK VISUALIZATION

Render the network using a force-directed graph.

Every institution is represented as a node.

Every relationship is represented as an edge.

---

## NODE HEALTH

Nodes must communicate health status:

* Healthy
* Stressed
* Defaulted

Use clear semantic visual encoding.

The graph should be understandable without reading every label.

Use:

* Node fill/border
* Status indicator
* Selected state
* Simulation state

Avoid excessive glow.

---

# NODE STATES

Nodes should support these states:

### Normal

Standard network appearance.

### Hovered

Subtle emphasis and tooltip.

### Selected

Strong visual emphasis.

### Default Origin

Very clear distinction.

### Affected

Highlighted based on simulation result.

### Unaffected

Visually de-emphasized during simulation, but NOT removed.

### Path Node

Strongly highlighted when part of the selected propagation path.

---

# EDGE TYPES

The graph contains:

### TRADES_WITH

Represents direct trading relationships.

### POSTS_COLLATERAL

Represents collateral relationships.

### OWNED_BY

Represents ownership relationships.

These must be visually distinguishable.

Use combinations of:

* Line style
* Stroke weight
* Directionality where applicable
* Subtle visual encoding

Do not rely exclusively on color.

Provide a persistent graph legend.

---

# IMPORTANT SIMULATION RULE

All three relationship types should be visible in the network.

However:

## Default propagation traverses ONLY:

* TRADES_WITH
* POSTS_COLLATERAL

It does NOT traverse:

* OWNED_BY

Do not visually imply that OWNED_BY contributes to propagation unless the backend explicitly returns it as part of the simulation.

---

# GRAPH CONTROLS

Provide conventional, visible graph controls:

* Zoom in
* Zoom out
* Reset/recenter
* Fit network
* Optional search

Users should not have to discover graph interactions.

Support:

* Pan
* Zoom
* Node selection
* Node dragging if useful

Avoid unusual gesture-based controls.

---

# FR2 — INSTITUTION DETAIL

When a node is clicked:

Open/update the right-side detail panel.

The panel should clearly identify the selected institution.

Structure:

## Institution

Name

## Status

Health status

## Classification

* Type
* Tier

## Exposure

**Total Direct Exposure**

Make this a prominent metric.

## Direct Relationships

Display a readable list/table:

| Institution   | Relationship     |
| ------------- | ---------------- |
| Institution A | TRADES_WITH      |
| Institution B | POSTS_COLLATERAL |

Use the API response.

The panel should be useful without requiring the user to inspect the graph.

---

# PRIMARY ACTION

If an institution is selected, the panel should contain a highly visible:

**Simulate Default**

button.

The button should be close to the selected institution's information.

The user should never wonder:

> "How do I start the simulation?"

---

# FR3 — DEFAULT SIMULATION

When the user clicks:

**Simulate Default**

call:

`POST /api/simulate-default`

using the selected institution.

The simulation represents:

> "What happens if this institution defaults?"

---

# SIMULATION EXPERIENCE

The simulation is the central moment of the demo.

Use a short, purposeful animation to communicate propagation.

Suggested sequence:

### Phase 1

Selected institution becomes the default origin.

### Phase 2

Propagation begins outward.

### Phase 3

Affected institutions appear/highlight according to hop distance.

### Phase 4

Results settle into the side panel.

The animation should reinforce the analytical concept:

**origin → propagation → affected network**

Do not use long or distracting animations.

The user should be able to understand the final state even if animation is disabled.

---

# HOP DISTANCE

Affected institutions must be visually distinguished according to their hop distance from the default origin.

For example:

**1 hop**

Directly affected.

**2 hops**

One intermediary.

**3 hops**

Two intermediaries.

Continue through the backend's maximum traversal depth.

Use both:

* Visual differentiation
* Explicit hop labels

Do not rely on animation alone.

---

# SIMULATION SUMMARY

After completion, show a compact summary.

Example:

## Default Simulation

**Origin**

Institution X

**Affected Institutions**

17

**Maximum Reach**

5 hops

**Total Exposure**

$XXM

Use actual API data where available.

Do not invent metrics that the backend does not provide.

---

# AFFECTED INSTITUTIONS LIST

The side panel should show affected institutions ranked according to the ordering provided by the backend.

Each result should clearly show:

* Institution name
* Health status
* Hop distance
* Exposure if available

Example:

**Bank Alpha**

1 hop · $12.4M exposure

**Fund Beta**

2 hops · $8.7M exposure

**Dealer Gamma**

3 hops · $4.2M exposure

Clicking an institution in this list should select the corresponding graph node.

---

# GRAPH + LIST SYNCHRONIZATION

The graph and side panel must always remain synchronized.

If the user:

* Clicks a graph node → update panel.
* Clicks an affected institution → highlight node.
* Clicks a result in the side panel → highlight node.
* Selects a path → highlight exact edges.
* Resets simulation → restore normal graph state.

The user should never lose track of which visual element corresponds to which data item.

---

# FR4 — PATH EXPLANATION

This is the second major analytical moment.

When the user selects an affected institution:

Call:

```http
GET /api/path?from=X&to=Y
```

where:

* X = default origin
* Y = affected institution

Then show:

## Why is this institution affected?

Display the actual traversal path.

For example:

**Defaulted Institution**

↓ `TRADES_WITH`

**Institution B**

↓ `POSTS_COLLATERAL`

**Institution C**

↓ `TRADES_WITH`

**Affected Institution**

The exact relationship types must come from the API.

Do not fabricate or simplify the path.

---

# PATH VISUALIZATION

The selected path should also be highlighted directly in the graph.

Highlight:

* Origin node
* Intermediate nodes
* Destination node
* Exact edges forming the path

De-emphasize unrelated edges.

However, keep the rest of the network visible so the user retains context.

This creates two simultaneous explanations:

### Spatial explanation

The user sees the path on the graph.

### Textual explanation

The user sees the same path in the side panel.

These two views must correspond exactly.

---

# PATH PANEL DESIGN

Use a vertical relationship timeline.

Example:

### Path to Institution C

**Institution A**
`TRADES_WITH`

↓

**Institution B**
`POSTS_COLLATERAL`

↓

**Institution C`

At each relationship step, make the relationship type visually prominent.

If the API provides exposure or other relationship metadata, display it alongside the relevant relationship.

---

# SIMULATION RESET

When a simulation is active, provide:

**Clear Simulation**

or

**Reset Simulation**

This should:

* Remove affected-state highlighting
* Remove path highlighting
* Return nodes to normal health visualization
* Restore the standard institution view
* Keep the network loaded

Do not require a page refresh.

---

# SEARCH / DISCOVERY

Because the graph may contain many institutions, provide institution search.

A user should be able to search:

**Search institutions...**

Selecting a search result should:

* Center the graph on that node
* Select it
* Open institution details

Search is particularly important for a dense network.

---

# EMPTY / LOADING / ERROR STATES

Implement proper application states.

## Network loading

Show a meaningful loading state.

Example:

**Loading financial network…**

## Institution loading

Show a compact skeleton in the side panel.

## Simulation loading

Show:

**Simulating default propagation…**

Do not make the user wonder whether the button worked.

## Path loading

Show:

**Tracing propagation path…**

## API error

Display a useful error message and allow retry.

Never leave the panel blank without explanation.

---

# VISUAL HIERARCHY

At all times the user should understand:

### WHAT AM I LOOKING AT?

Institution network.

### WHAT IS SELECTED?

Clearly highlighted institution.

### WHAT CAN I DO?

Simulate Default.

### WHAT HAPPENED?

Affected institutions and propagation depth.

### WHY DID IT HAPPEN?

Exact relationship path.

This hierarchy is more important than visual novelty.

---

# RESPONSIVE BEHAVIOR

Desktop is the primary target because network analysis benefits from a large canvas.

On smaller screens:

* Graph remains primary.
* Side panel becomes a drawer.
* Simulation results become a bottom sheet or full-width panel.
* Institution details remain readable.
* Graph controls remain accessible.

Do not attempt to preserve a desktop three-column layout on mobile.

---

# ACCESSIBILITY

Use:

* Semantic controls
* Keyboard navigation
* Visible focus states
* Accessible labels
* Sufficient contrast
* Text labels in addition to color
* Reduced motion support

Important state differences must not depend exclusively on color.

---

# MOTION PRINCIPLES

Motion should explain the simulation.

Good:

* Force-directed graph settling
* Node selection transition
* Propagation animation
* Path highlighting
* Panel transitions
* Loading indicators

Bad:

* Constant floating cards
* Floating UI controls
* Cursor-following elements
* Random particles
* Animated backgrounds
* Rotating UI
* Excessive parallax
* Continuous drifting elements

The application should become calmer after the simulation finishes.

---

# DESIGN SYSTEM

Create a coherent visual system for:

* Colors
* Typography
* Spacing
* Borders
* Shadows
* Buttons
* Panels
* Status indicators
* Graph nodes
* Graph edges
* Tooltips
* Tables
* Metrics

Avoid designing each component independently.

The interface should feel like one cohesive analytical instrument.

---

# IMPORTANT: DO NOT OVERDESIGN

Do not add functionality that isn't required simply to make the demo feel impressive.

Do not add:

* Fake KPIs
* Fake market tickers
* Fake charts
* Fake notifications
* Fake alerts
* Fake portfolio data
* Decorative dashboards
* Unnecessary tabs
* Artificial complexity

Every visual element should support the story of **financial network contagion**.

---

# DEMO-FIRST THINKING

This is a demonstration.

The ideal demo flow should take roughly:

**30–60 seconds**

A presenter should be able to show:

1. The network.
2. Select a counterparty.
3. Show its exposure.
4. Click **Simulate Default**.
5. Watch the ripple propagate.
6. Show affected institutions.
7. Click one.
8. Explain the exact relationship path.

The interface should make this sequence extremely easy to perform live.

---

# FINAL UX TEST

Imagine a user has never seen this application before.

Give them no documentation.

Ask them to:

> "Show me what happens if this institution defaults."

They should naturally be able to:

**Find institution → select it → understand it → simulate default → see affected institutions → select one → understand the path.**

If they struggle, simplify the UI.

Do not solve usability problems with more animations or more visual effects.

---

# FINAL DESIGN PRINCIPLE

Build an interface that makes a complex network phenomenon feel simple.

The underlying concept is complicated:

**Institutions → relationships → exposure → default → propagation → affected institutions → path explanation**

The UI's job is to turn that complexity into a story that users can understand visually.

The final experience should feel:

**Sophisticated enough to impress.
Simple enough to understand.
Analytical enough to trust.
Fast enough to demonstrate.**

The graph is the hero.

The simulation is the story.

The path explanation is the proof.

Everything else should support those three things.

Before coding, briefly state the chosen visual direction and explain how the design will preserve usability. Then implement the complete working frontend against the provided APIs.
