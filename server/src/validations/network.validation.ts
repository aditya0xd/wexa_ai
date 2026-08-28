import { z } from "zod";

/**
 * Zod validation schemas for all Network & Contagion API endpoints
 */

// GET /api/institutions/:id
export const getInstitutionParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Institution ID must not be empty"),
});

// POST /api/simulate-default
export const simulateDefaultBodySchema = z.object({
  institutionId: z
    .string()
    .trim()
    .min(1, "institutionId is required and must not be empty"),
});

// GET /api/path?from=X&to=Y
export const getPathQuerySchema = z.object({
  from: z
    .string()
    .trim()
    .min(1, "Query parameter 'from' is required"),
  to: z
    .string()
    .trim()
    .min(1, "Query parameter 'to' is required"),
});
