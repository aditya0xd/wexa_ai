import type { Server } from "node:http";
import { logger } from "../utils/logger.js";
import { config } from "./config.js";

type CleanupHandler = () => Promise<void> | void;

export class GracefulShutdownManager {
  private server: Server;
  private cleanupHandlers: CleanupHandler[] = [];
  private isShuttingDown = false;
  private timeoutMs: number;

  constructor(server: Server, timeoutMs = 10000) {
    this.server = server;
    this.timeoutMs = timeoutMs;
  }

  public addCleanupHandler(handler: CleanupHandler): void {
    this.cleanupHandlers.push(handler);
  }

  public async shutdown(signal: string, exitCode = 0): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn(`Shutdown already in progress. Received another signal: ${signal}`);
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    // Force terminate if graceful cleanup exceeds timeout
    const forceExitTimer = setTimeout(() => {
      logger.error(`Graceful shutdown timed out after ${this.timeoutMs}ms. Forcefully exiting.`);
      process.exit(1);
    }, this.timeoutMs);
    forceExitTimer.unref();

    try {
      // 1. Stop accepting new HTTP connections (and close idle ones if available)
      if (typeof this.server.closeIdleConnections === "function") {
        this.server.closeIdleConnections();
      }

      await new Promise<void>((resolve) => {
        if (!this.server.listening) {
          return resolve();
        }
        this.server.close((err) => {
          if (err) {
            logger.warn(`HTTP server close issue: ${err.message}`);
          } else {
            logger.info("HTTP server closed to new requests.");
          }
          resolve();
        });
      });

      // 2. Execute custom cleanup tasks (DB disconnections, queue flushes, etc.)
      for (const handler of this.cleanupHandlers) {
        try {
          await handler();
        } catch (handlerErr) {
          const err = handlerErr as Error;
          logger.error(`Cleanup task failed: ${err.message}`, { stack: err.stack });
        }
      }

      logger.info("All cleanup tasks completed successfully. Exiting process.");
      clearTimeout(forceExitTimer);
      process.exit(exitCode);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error encountered during graceful shutdown: ${err.message}`, {
        stack: err.stack,
      });
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }

  public setupProcessListeners(): void {
    // Termination signals
    process.on("SIGTERM", () => this.shutdown("SIGTERM", 0));
    process.on("SIGINT", () => this.shutdown("SIGINT", 0));

    // Unhandled Promise Rejections
    process.on("unhandledRejection", (reason: Error | unknown) => {
      logger.error("Unhandled Rejection detected:", {
        error: reason instanceof Error ? reason.stack : reason,
      });
      if (config.NODE_ENV === "production") {
        this.shutdown("unhandledRejection", 1);
      }
    });

    // Uncaught Exceptions (Fail-fast)
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception detected:", {
        error: error.stack || error.message,
      });
      this.shutdown("uncaughtException", 1);
    });
  }
}
