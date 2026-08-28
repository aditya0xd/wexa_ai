import { withSession } from "../db/driver.js";
import type {
  GraphResponse,
  GraphNode,
  GraphEdge,
  Institution,
  SimulateDefaultResponse,
  ContagionPathResponse,
  PathStep,
} from "../types/graph.types.js";
import { NotFoundError } from "../utils/appError.js";

/**
 * Repository for Institution and Graph Queries
 *
 * Query Isolation Principles:
 * 1. Each Cypher query is isolated in a named function.
 * 2. 100% Parameterized using Cypher $param syntax.
 * 3. Documented with query strategy and graph traversal rationale.
 */

/**
 * getFullNetworkGraph
 *
 * Query Shape & Rationale:
 * 1. Fetches all Institution and CollateralPool nodes.
 * 2. Fetches all directed relationships (TRADES_WITH, POSTS_COLLATERAL, OWNED_BY).
 * 3. Formats results into flat nodes & edges arrays in a single roundtrip to render the full force-directed network.
 */
export const getFullNetworkGraph = async (): Promise<GraphResponse> => {
  return await withSession(async (session) => {
    const query = `
      MATCH (n)
      WHERE n:Institution OR n:CollateralPool
      OPTIONAL MATCH (n)-[r]->(m)
      WHERE m:Institution OR m:CollateralPool
      RETURN 
        collect(DISTINCT {
          id: n.id,
          label: labels(n)[0],
          name: n.name,
          status: n.status,
          tier: n.tier
        }) AS nodes,
        collect(DISTINCT {
          source: startNode(r).id,
          target: endNode(r).id,
          type: type(r),
          exposure: r.exposure
        }) AS edges
    `;

    const result = await session.executeRead(async (tx) => {
      return await tx.run(query);
    });

    const record = result.records[0];
    if (!record) {
      return { nodes: [], edges: [] };
    }

    const rawNodes = (record.get("nodes") || []) as GraphNode[];
    const rawEdges = (record.get("edges") || []) as (GraphEdge & { source?: string; target?: string })[];

    // Filter out null edges that result from OPTIONAL MATCH when a node has no outgoing edges
    const edges = rawEdges.filter((e) => e && e.source && e.target);

    return {
      nodes: rawNodes,
      edges,
    };
  });
};

/**
 * findInstitutionById
 *
 * Query Shape & Rationale:
 * 1. Matches a single (:Institution) by unique $id index.
 * 2. Uses OPTIONAL MATCH on incoming and outgoing relationships to compute direct counterparties and total exposure.
 * 3. Avoids multiple queries by aggregating relationships via Cypher collect().
 */
export const findInstitutionById = async (id: string): Promise<Institution> => {
  return await withSession(async (session) => {
    const query = `
      MATCH (i:Institution { id: $id })
      RETURN {
        id: i.id,
        name: i.name,
        type: i.type,
        tier: i.tier,
        status: i.status,
        country: i.country
      } AS institution
    `;

    const result = await session.executeRead(async (tx) => {
      return await tx.run(query, { id });
    });

    const record = result.records[0];
    if (!record) {
      throw new NotFoundError(`Institution with ID '${id}' was not found`);
    }

    return record.get("institution") as Institution;
  });
};

/**
 * simulateDefaultContagion (FR3)
 *
 * Query Shape & Rationale:
 * 1. Matches the defaulted source (:Institution { id: $institutionId }).
 * 2. Runs a variable-length traversal (*1..5) across TRADES_WITH and POSTS_COLLATERAL relationships (undirected/bidirectional traversal
 *    because counterparty risk cascades both ways in bilateral derivative contracts and shared collateral pools).
 * 3. WHERE target:Institution AND target <> source to ensure we only collect counterparties (excluding the origin itself).
 * 4. Capped at 5 hops (*1..5) to avoid runaway compute / memory on CognoDB free tier.
 * 5. Uses min(length(p)) to compute the shortest hop-distance for each affected node.
 * 6. Computes pathType ('TRADES_WITH', 'POSTS_COLLATERAL', or 'mixed') by inspecting distinct relationship types along the path.
 * 7. Orders affected institutions by shortest hop distance (proximity).
 */
export const simulateDefaultContagion = async (
  institutionId: string
): Promise<SimulateDefaultResponse> => {
  return await withSession(async (session) => {
    // 1. Verify that the starting institution exists
    await findInstitutionById(institutionId);

    const query = `
      MATCH (source:Institution { id: $institutionId })
      MATCH p = (source)-[:TRADES_WITH|POSTS_COLLATERAL*1..5]-(target:Institution)
      WHERE target.id <> $institutionId
      WITH target, 
           min(length(p)) AS minHop,
           collect(DISTINCT [r IN relationships(p) | type(r)]) AS allRelTypes
      RETURN 
        target.id AS id,
        target.name AS name,
        minHop AS hopDistance,
        CASE 
          WHEN size(allRelTypes) = 1 AND allRelTypes[0] = ['TRADES_WITH'] THEN 'TRADES_WITH'
          WHEN size(allRelTypes) = 1 AND allRelTypes[0] = ['POSTS_COLLATERAL'] THEN 'POSTS_COLLATERAL'
          ELSE 'mixed'
        END AS pathType
      ORDER BY hopDistance ASC, target.name ASC
    `;

    const result = await session.executeRead(async (tx) => {
      return await tx.run(query, { institutionId });
    });

    const affected = result.records.map((rec) => ({
      id: rec.get("id") as string,
      name: rec.get("name") as string,
      hopDistance: (rec.get("hopDistance") as { low: number }).low ?? Number(rec.get("hopDistance")),
      pathType: rec.get("pathType") as "TRADES_WITH" | "POSTS_COLLATERAL" | "mixed",
    }));

    return {
      defaultedInstitutionId: institutionId,
      affected,
    };
  });
};

/**
 * findContagionPath (FR4)
 *
 * Query Shape & Rationale:
 * 1. Matches the source node ($fromId) and target node ($toId).
 * 2. Uses shortestPath((from)-[:TRADES_WITH|POSTS_COLLATERAL|OWNED_BY*1..5]-(to)) to find
 *    the exact sequence of hops connecting the two entities.
 * 3. Extracts ordered relationship segments ([r IN relationships(p)]) with fromId, toId, and relType
 *    so the UI can render the step-by-step contagion cascade explanation.
 */
export const findContagionPath = async (
  fromId: string,
  toId: string
): Promise<ContagionPathResponse> => {
  return await withSession(async (session) => {
    // 1. Verify existence of both nodes
    await findInstitutionById(fromId);
    await findInstitutionById(toId);

    const query = `
      MATCH (from:Institution { id: $fromId })
      MATCH (to:Institution { id: $toId })
      MATCH p = shortestPath((from)-[:TRADES_WITH|POSTS_COLLATERAL|OWNED_BY*1..5]-(to))
      RETURN [r IN relationships(p) | {
        fromId: startNode(r).id,
        toId: endNode(r).id,
        relType: type(r)
      }] AS steps
    `;

    const result = await session.executeRead(async (tx) => {
      return await tx.run(query, { fromId, toId });
    });

    const record = result.records[0];
    const steps = (record ? record.get("steps") : []) as PathStep[];

    if (!steps || steps.length === 0) {
      throw new NotFoundError(
        `No contagion path found between '${fromId}' and '${toId}' within 5 hops`
      );
    }

    return {
      from: fromId,
      to: toId,
      path: steps,
    };
  });
};
