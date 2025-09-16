import { Client, GatewayIntentBits, Collection } from "discord.js";
import type { Command } from "./types/command.js";
import * as http from "node:http";
import { config } from "./config/config.js";
import { logger } from "./utils/logger.js";
import { loadCommands } from "./loaders/commands.js";
import { loadEvents } from "./loaders/events.js";

// Augment client type to include commands collection
declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

await loadCommands(client);
await loadEvents(client);

client.on("error", (e) => logger.error("Client error:", e));
client.on("warn", (w) => logger.warn("Client warning:", w));
process.on("unhandledRejection", (e) =>
  logger.error("Unhandled rejection:", e)
);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(config.healthPort || 3001, () => {
  logger.info(`🩺 Health server listening on :${config.healthPort || 3001}`);
});

client
  .login(process.env.DISCORD_TOKEN)
  .then(() => logger.info("Discord login successful"))
  .catch((err) => logger.error("Discord login failed:", err));
