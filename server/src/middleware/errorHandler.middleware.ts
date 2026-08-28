import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError, NotFoundError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

// Catch 404 and forward to error handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
};

// Centralized error handling middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;
  const isProduction = config.NODE_ENV === "production";

  // Log error with appropriate severity & context
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      isOperational,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode}: ${err.message}`);
  }

  // Determine clean, client-safe message (never leak raw SQL/Cypher, database credentials, or system paths)
  let clientMessage: string;
  if (isAppError && isOperational) {
    clientMessage = err.message;
  } else if (!isProduction) {
    clientMessage = err.message;
  } else {
    clientMessage = "An unexpected error occurred. Please try again later.";
  }

  // Response payload (never leak stack traces or raw database error dumps to clients in production)
  res.status(statusCode).json({
    status: statusCode < 500 ? "fail" : "error",
    message: clientMessage,
    ...(!isProduction && { stack: err.stack }),
  });
};
