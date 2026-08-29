import type {
  GraphResponse,
  Institution,
  SimulateDefaultResponse,
  ContagionPathResponse,
  HealthResponse,
} from "../types/graph.types.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // FR1: Get entire network graph
  getNetwork: (signal?: AbortSignal): Promise<GraphResponse> => {
    return fetchJson<GraphResponse>("/network", { signal });
  },

  // FR2: Get single institution details & exposure
  getInstitution: (id: string): Promise<Institution> => {
    return fetchJson<Institution>(`/institutions/${encodeURIComponent(id)}`);
  },

  // FR3: Trigger default simulation
  simulateDefault: (institutionId: string): Promise<SimulateDefaultResponse> => {
    return fetchJson<SimulateDefaultResponse>("/simulate-default", {
      method: "POST",
      body: JSON.stringify({ institutionId }),
    });
  },

  // FR4: Path explanation between defaulted and affected node
  getPath: (fromId: string, toId: string): Promise<ContagionPathResponse> => {
    return fetchJson<ContagionPathResponse>(
      `/path?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`
    );
  },

  // NFR2: Health check
  getHealth: (): Promise<HealthResponse> => {
    return fetchJson<HealthResponse>("/health");
  },
};
