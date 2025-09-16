import {
  Client,
  GatewayIntentBits,
  Collection,
  Options,
  Partials,
} from "discord.js";
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
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

client.commands = new Collection();

// Gestion des erreurs non attrapées
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

// Charger les commandes et les événements
async function startBot() {
  try {
    await loadCommands(client);
    await loadEvents(client);

    await client.login(process.env.DISCORD_TOKEN);
    logger.info("✅ Bot connecté avec succès");
  } catch (error) {
    logger.error("Erreur lors du démarrage du bot:", error);
    process.exit(1);
  }
}

// Démarrer le serveur de santé
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

// Démarrer le bot
startBot();
