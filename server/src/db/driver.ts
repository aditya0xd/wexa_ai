import neo4j from "neo4j-driver";
import type { Driver, Session, SessionConfig } from "neo4j-driver";
import { config } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import { AppError, DatabaseConnectionError } from "../utils/appError.js";

/**
 * Singleton Driver instance for CognoDB (Neo4j-compatible openCypher Bolt database).
 * Rule: ONE Driver per application lifetime, MANY lightweight sessions per request/query.
 */
let driver: Driver | null = null;

/**
 * Initializes the singleton Driver connection pool at server startup.
 */
export const initDriver = (): Driver => {
  if (!driver) {
    driver = neo4j.driver(
      config.COGNODB_URI,
      neo4j.auth.basic(config.COGNODB_USER, config.COGNODB_PASSWORD),
      {
        maxConnectionLifetime: 30 * 60 * 1000, // 30 minutes (recommended for cloud load balancers)
        maxConnectionPoolSize: 50, // Keep within CognoDB free-tier limits (capped at 200)
        connectionAcquisitionTimeout: 5000, // 5 seconds
        maxTransactionRetryTime: 15000, // 15 seconds automatic retry on transient cloud drops
        logging: {
          level: config.NODE_ENV === "production" ? "warn" : "info",
          logger: (level, message) => {
            // Ignore normal TCP server-side idle timeouts so they don't pollute logs
            if (message.includes("Connection was closed by server") || message.includes("Connection reset")) {
              logger.debug(`[CognoDB Driver] Transient disconnect (driver will auto-reconnect): ${message}`);
              return;
            }
            if (level === "error") logger.error(`[CognoDB Driver] ${message}`);
            else if (level === "warn") logger.warn(`[CognoDB Driver] ${message}`);
            else if (level === "info") logger.debug(`[CognoDB Driver] ${message}`);
          },
        },
      }
    );
    logger.info("CognoDB Bolt Driver initialized successfully.");
  }
  return driver;
};

/**
 * Retrieves the singleton driver instance.
 */
export const getDriver = (): Driver => {
  if (!driver) {
    return initDriver();
  }
  return driver;
};

/**
 * Helper to identify whether an error is a Bolt/Neo4j connectivity or pool acquisition error.
 */
export const isDbConnectionError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const err = error as { code?: string; message?: string; name?: string };

  const connectionErrorCodes = [
    "ServiceUnavailable",
    "SessionExpired",
    "ConnectionAcquisitionTimedOut",
    "Failed to connect to any known server",
  ];

  const hasMatchingCode =
    Boolean(err.code && connectionErrorCodes.some((code) => err.code?.includes(code)));

  const hasMatchingMessage =
    Boolean(err.message && (
      err.message.includes("Failed to connect") ||
      err.message.includes("Connection refused") ||
      err.message.includes("Connection acquisition timed out") ||
      err.message.includes("ServiceUnavailable") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("ETIMEDOUT") ||
      err.message.includes("ENOTFOUND")
    ));

  return hasMatchingCode || hasMatchingMessage || err.name === "Neo4jError";
};

/**
 * Database Error Boundary:
 * Wraps database operations, logs errors, and maps connection failures
 * to a clean operational 503 DatabaseConnectionError.
 */
export const withDbErrorBoundary = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    // If it's already an operational AppError, let it propagate
    if (error instanceof AppError) {
      throw error;
    }

    if (isDbConnectionError(error)) {
      const err = error as Error;
      logger.error(`[Database Error Boundary] DB Connection failure: ${err.message}`, {
        stack: err.stack,
      });
      throw new DatabaseConnectionError(
        "Database is temporarily unavailable. Please try again shortly."
      );
    }

    // Re-throw unknown/query errors for central error handling
    throw error;
  }
};

/**
 * Creates a fresh session for a single request / query execution.
 * Always close the session in a finally block!
 */
export const getSession = (sessionConfig?: SessionConfig): Session => {
  return getDriver().session(sessionConfig);
};

/**
 * Helper to run a callback with an auto-managed session and error boundary.
 * Guarantees:
 * 1. Session is closed in `finally` to prevent connection leaks.
 * 2. DB connection failures surface as clean 503 responses rather than crashing the process.
 */
export const withSession = async <T>(
  work: (session: Session) => Promise<T>,
  sessionConfig?: SessionConfig
): Promise<T> => {
  return await withDbErrorBoundary(async () => {
    const session = getSession(sessionConfig);
    try {
      return await work(session);
    } finally {
      await session.close();
    }
  });
};

/**
 * Executes a startup connectivity check using `RETURN 1 AS ping`.
 * Fails fast and logs an actionable error message if .env or credentials are misconfigured.
 */
export const pingDatabaseOnStartup = async (): Promise<void> => {
  logger.info("Executing database startup check (RETURN 1)...");
  try {
    const session = getSession();
    try {
      await session.executeRead(async (tx) => {
        return await tx.run("RETURN 1 AS ping");
      });
      logger.info("Database startup check passed: CognoDB is reachable and credentials are valid.");
    } finally {
      await session.close();
    }
  } catch (error) {
    const err = error as Error;
    logger.error("DATABASE STARTUP CHECK FAILED: Unable to reach CognoDB.", {
      message: err.message,
      uri: config.COGNODB_URI,
      user: config.COGNODB_USER,
      hint: "Please check your .env file (COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD).",
    });
    throw error;
  }
};

/**
 * Verifies connectivity to the database during live health checks.
 */
export const verifyConnectivity = async (): Promise<boolean> => {
  try {
    const activeDriver = getDriver();
    await activeDriver.verifyConnectivity();
    return true;
  } catch (error) {
    logger.warn(`CognoDB connectivity check failed: ${(error as Error).message}`);
    return false;
  }
};

/**
 * Gracefully shuts down the driver and drains all active connection pools.
 */
export const closeDriver = async (): Promise<void> => {
  if (driver) {
    logger.info("Closing CognoDB Bolt Driver and draining connection pool...");
    await driver.close();
    driver = null;
    logger.info("CognoDB Bolt Driver closed.");
  }
};
