import * as networkRepo from "../repo/network.repo.js";
import { verifyConnectivity } from "../db/driver.js";
import { config } from "../utils/config.js";
import type {
  GraphResponse,
  Institution,
  SimulateDefaultResponse,
  ContagionPathResponse,
} from "../types/graph.types.js";
import { BadRequestError } from "../utils/appError.js";

/**
 * Service Layer: Business logic & validation for Network and Institutions
 */

export const getNetworkOverview = async (): Promise<GraphResponse> => {
  return await networkRepo.getFullNetworkGraph();
};

export const getInstitutionDetails = async (id: string): Promise<Institution> => {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new BadRequestError("Institution ID must be a non-empty string");
  }

  return await networkRepo.findInstitutionById(id.trim());
};

export const simulateDefault = async (institutionId: string): Promise<SimulateDefaultResponse> => {
  if (!institutionId || typeof institutionId !== "string" || institutionId.trim() === "") {
    throw new BadRequestError("Valid 'institutionId' is required in request body");
  }

  return await networkRepo.simulateDefaultContagion(institutionId.trim());
};

export const getContagionExplanation = async (
  from: string,
  to: string
): Promise<ContagionPathResponse> => {
  if (!from || typeof from !== "string" || from.trim() === "") {
    throw new BadRequestError("Query parameter 'from' is required");
  }
  if (!to || typeof to !== "string" || to.trim() === "") {
    throw new BadRequestError("Query parameter 'to' is required");
  }

  return await networkRepo.findContagionPath(from.trim(), to.trim());
};

export const getSystemHealth = async () => {
  const dbConnected = await verifyConnectivity();
  return {
    status: dbConnected ? "ok" : "degraded",
    services: {
      server: "healthy",
      database: dbConnected ? "connected" : "disconnected",
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    environment: config.NODE_ENV,
  };
};
