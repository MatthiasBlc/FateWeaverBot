import { logger } from "../utils/logger.js";

export interface BotConfig {
  prefix: string;
  healthPort: number;
  apiUrl: string;
}

logger.debug("Chargement de la configuration...");
logger.debug("BOT_PREFIX: %s", process.env.BOT_PREFIX);
logger.debug("HEALTH_PORT: %s", process.env.HEALTH_PORT);
logger.debug("API_URL: %s", process.env.API_URL);

export const config: BotConfig = {
  prefix: process.env.BOT_PREFIX || "!",
  healthPort: process.env.HEALTH_PORT
    ? parseInt(process.env.HEALTH_PORT)
    : 3001,
  apiUrl: process.env.API_URL || "http://backenddev:3000",
};

logger.debug("Configuration finale: %O", config);
