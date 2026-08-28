// src/types/graph.ts

// ─── Node types ──────────────────────────────────────────────

export type InstitutionType = "Bank" | "HedgeFund" | "Broker" | "Corporate" | "Insurer";
export type InstitutionStatus = "Healthy" | "Stressed" | "Defaulted";
export type AssetClass = "CorporateBonds" | "Sovereign" | "Equities" | "MBS";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  tier: "Tier1" | "Tier2" | "Tier3";
  status: InstitutionStatus;
  country?: string;
}

export interface CollateralPool {
  id: string;
  name: string;
  assetClass: AssetClass;
}

// ─── Relationship types ──────────────────────────────────────

export type ProductType = "IRS" | "CDS" | "FXSwap" | "RepoAgreement";

export interface TradesWithRel {
  exposure: number;
  product: ProductType;
}

export interface PostsCollateralRel {
  value: number;
}

export interface OwnedByRel {
  percentage: number;
}

// ─── Graph view shapes (what the frontend renders) ───────────

// A generic node shape for the visualization layer —
// collapses Institution/CollateralPool into one renderable type
export interface GraphNode {
  id: string;
  label: "Institution" | "CollateralPool";
  name: string;
  // only present when label is "Institution"
  status?: InstitutionStatus;
  tier?: string;
}

export interface GraphEdge {
  source: string;       // node id
  target: string;       // node id
  type: "TRADES_WITH" | "POSTS_COLLATERAL" | "OWNED_BY";
  exposure?: number;     // only for TRADES_WITH
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Simulation (FR3) response shapes ────────────────────────

export interface AffectedInstitution {
  id: string;
  name: string;
  hopDistance: number;   // degree of separation from the defaulted node
  pathType: "TRADES_WITH" | "POSTS_COLLATERAL" | "mixed";
}

export interface SimulateDefaultResponse {
  defaultedInstitutionId: string;
  affected: AffectedInstitution[];
}

// ─── Path explanation (FR4) response shape ───────────────────

export interface PathStep {
  fromId: string;
  toId: string;
  relType: "TRADES_WITH" | "POSTS_COLLATERAL" | "OWNED_BY";
}

export interface ContagionPathResponse {
  from: string;
  to: string;
  path: PathStep[];
}