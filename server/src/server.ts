import app from "./app.js";
import { logger } from "./utils/logger.js";
import { config } from "./utils/config.js";
import { GracefulShutdownManager } from "./utils/shutdown.js";
import { closeDriver, pingDatabaseOnStartup } from "./db/driver.js";

const PORT = config.PORT;

const startServer = async () => {
    // Optional startup check: fail-fast if DB / .env is misconfigured
    try {
        await pingDatabaseOnStartup();
    } catch {
        logger.warn("Server starting with degraded database connectivity. Check .env configuration.");
    }

    const server = app.listen(PORT, () => {
        logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    });

    // Initialize Graceful Shutdown Manager
    const shutdownManager = new GracefulShutdownManager(server, 10000);

    // Attach process listeners (SIGTERM, SIGINT, unhandledRejection, uncaughtException)
    shutdownManager.setupProcessListeners();
    shutdownManager.addCleanupHandler(async () => {
        await closeDriver();
    });

    return { server, shutdownManager };
};

export const { server, shutdownManager } = await startServer();