import express from "express";
import cors from "cors";
import { morganMiddleware } from "./middleware/morgan.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.middleware.js";
import { config } from "./utils/config.js";

import networkRouter from "./router/network.router.js";
import * as networkController from "./controller/network.controller.js";

const app = express();

// Security & Parsing Middlewares
app.use(cors({
    origin: config.CORS_ORIGIN
}));
app.use(express.json());

// HTTP Request Logging
app.use(morganMiddleware);

// API Routes
app.use("/api", networkRouter);

// Root Health & Welcome
app.get("/health", networkController.getHealthCheck);
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// 404 & Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;