import { Router } from "express";
import * as networkController from "../controller/network.controller.js";
import { validateRequest } from "../middleware/validateRequest.middleware.js";
import {
  getInstitutionParamsSchema,
  simulateDefaultBodySchema,
  getPathQuerySchema,
} from "../validations/network.validation.js";

const router = Router();

// GET /api/network - Get entire force-directed graph view (nodes & edges)
router.get("/network", networkController.getNetwork);

// GET /api/institutions/:id - Get specific institution details and exposures
router.get(
  "/institutions/:id",
  validateRequest({ params: getInstitutionParamsSchema }),
  networkController.getInstitution
);

// POST /api/simulate-default - Runs variable-length traversal (FR3)
router.post(
  "/simulate-default",
  validateRequest({ body: simulateDefaultBodySchema }),
  networkController.simulateDefault
);

// GET /api/path?from=X&to=Y - Path explanation between defaulted node and affected node (FR4)
router.get(
  "/path",
  validateRequest({ query: getPathQuerySchema }),
  networkController.getPathExplanation
);

// GET /api/health - Database connectivity & system health check (NFR2)
router.get("/health", networkController.getHealthCheck);

export default router;
