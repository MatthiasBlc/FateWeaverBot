import { REST, Routes, ApplicationCommand } from "discord.js";
import { logger } from "./services/logger";
import { config, validateConfig } from "./config/index";

// Validate configuration at startup
try {
  validateConfig();
} catch (error) {
  logger.error("Configuration validation failed:", { error });
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(config.discord.token);
const clientId = config.discord.clientId;
const guildId = config.discord.guildId; // facultatif : pour voir les commandes guildées

async function listCommands() {
  try {
    // Commandes globales
    const globalCommands = (await rest.get(
      Routes.applicationCommands(clientId)
    )) as ApplicationCommand[];
    logger.info("=== Commandes globales ===");
    console.table(
      globalCommands.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        subcommands:
          c.options
            ?.filter((opt) => opt.type === 1 || opt.type === 2)
            .map((opt) => (opt.type === 2 ? `${opt.name} (group)` : opt.name))
            .join(", ") || "Aucune",
      }))
    );

    // Commandes guildées (optionnel)
    if (guildId) {
      const guildCommands = (await rest.get(
        Routes.applicationGuildCommands(clientId, guildId)
      )) as ApplicationCommand[];
      logger.info("=== Commandes guildées ===");
      console.table(
        guildCommands.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          subcommands:
            c.options
              ?.filter((opt) => opt.type === 1 || opt.type === 2)
              .map((opt) => (opt.type === 2 ? `${opt.name} (group)` : opt.name))
              .join(", ") || "Aucune",
        }))
      );
    }
  } catch (error) {
    logger.error("Erreur lors de la récupération des commandes :", { error });
  }
}

listCommands();
