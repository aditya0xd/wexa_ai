import morgan from "morgan";
import type { StreamOptions } from "morgan";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

const stream: StreamOptions = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const skip = () => {
  return config.NODE_ENV === "test";
};

const format = config.NODE_ENV === "production"
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
  : ":method :url :status :res[content-length] - :response-time ms";

export const morganMiddleware = morgan(format, { stream, skip });
