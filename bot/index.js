import { Client, GatewayIntentBits, Collection } from "discord.js";
import http from "http";
import { config } from "./config/config.js";
import { logger } from "./utils/logger.js";
import { loadCommands } from "./loaders/commands.js";
import { loadEvents } from "./loaders/events.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Register a commands collection on the client
client.commands = new Collection();

// Load commands and events
await loadCommands(client);
await loadEvents(client);

// Global error/warn handlers
client.on("error", (e) => logger.error("Client error:", e));
client.on("warn", (w) => logger.warn("Client warning:", w));
process.on("unhandledRejection", (e) =>
  logger.error("Unhandled rejection:", e)
);

// Minimal HTTP server for healthcheck
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
