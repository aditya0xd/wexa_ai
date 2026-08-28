import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as networkService from "../services/network.service.js";

/**
 * Controller: Handles HTTP requests, delegates to service, and formats responses
 */

export const getNetwork = asyncHandler(async (req: Request, res: Response) => {
  const data = await networkService.getNetworkOverview();
  res.status(200).json({
    status: "success",
    data,
  });
});

export const getInstitution = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await networkService.getInstitutionDetails(id as string);
  res.status(200).json({
    status: "success",
    data,
  });
});

export const simulateDefault = asyncHandler(async (req: Request, res: Response) => {
  const { institutionId } = req.body as { institutionId?: string };
  const data = await networkService.simulateDefault(institutionId as string);
  res.status(200).json({
    status: "success",
    data,
  });
});

export const getPathExplanation = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const data = await networkService.getContagionExplanation(from as string, to as string);
  res.status(200).json({
    status: "success",
    data,
  });
});

export const getHealthCheck = asyncHandler(async (req: Request, res: Response) => {
  const data = await networkService.getSystemHealth();
  res.status(data.status === "ok" ? 200 : 503).json(data);
});
