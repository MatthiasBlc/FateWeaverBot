import type { Client } from "discord.js";
import { logger } from "../utils/logger.js";

export default {
  name: "ready",
  once: true,
  execute(client: Client) {
    logger.info(`✅ Connecté en tant que ${client.user?.tag}`);
    client.user?.setPresence({
      activities: [{ name: "FateWeaver" }],
      status: "online",
    });
  },
};
