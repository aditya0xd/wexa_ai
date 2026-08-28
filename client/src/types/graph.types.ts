// Client-side TypeScript types mirrored from backend API specifications

export type InstitutionType = "Bank" | "HedgeFund" | "Broker" | "Corporate" | "Insurer";
export type InstitutionStatus = "Healthy" | "Stressed" | "Defaulted";
export type AssetClass = "CorporateBonds" | "Sovereign" | "Equities" | "MBS";
export type ProductType = "IRS" | "CDS" | "FXSwap" | "RepoAgreement";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  tier: "Tier1" | "Tier2" | "Tier3";
  status: InstitutionStatus;
  country?: string;
}

export interface GraphNode {
  id: string;
  label: "Institution" | "CollateralPool";
  name: string;
  status?: InstitutionStatus;
  tier?: string;
  // Canvas coordinate extensions used by force simulation
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "TRADES_WITH" | "POSTS_COLLATERAL" | "OWNED_BY";
  exposure?: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AffectedInstitution {
  id: string;
  name: string;
  hopDistance: number;
  pathType: "TRADES_WITH" | "POSTS_COLLATERAL" | "mixed";
}

export interface SimulateDefaultResponse {
  defaultedInstitutionId: string;
  affected: AffectedInstitution[];
}

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

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  database: "connected" | "disconnected";
  timestamp: string;
}
