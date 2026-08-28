import type { Request, Response, NextFunction } from "express";
import { type ZodTypeAny, ZodError } from "zod";
import { BadRequestError } from "../utils/appError.js";

interface RequestValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Higher-order middleware to validate incoming request body, query, and params against Zod schemas.
 * Throws clean, formatted BadRequestError (400) if validation fails.
 */
export const validateRequest = (schema: RequestValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = (await schema.body.parseAsync(req.body)) as Request["body"];
      }
      if (schema.query) {
        const parsedQuery = (await schema.query.parseAsync(req.query)) as Record<string, string>;
        Object.assign(req.query, parsedQuery);
      }
      if (schema.params) {
        const parsedParams = (await schema.params.parseAsync(req.params)) as Record<string, string>;
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues
          .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
          .join("; ");
        return next(new BadRequestError(`Validation failed - ${errorMessages}`));
      }
      next(error);
    }
  };
};
