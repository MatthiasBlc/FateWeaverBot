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
const guildId = config.discord.guildId?.trim();
const isGuildDeployment = !!guildId;

async function listCommands() {
  try {
    logger.info("=== 📋 Liste des commandes Discord déployées ===\n");
    
    // Commandes globales
    const globalCommands = (await rest.get(
      Routes.applicationCommands(clientId)
    )) as ApplicationCommand[];
    
    logger.info(`🌍 Commandes globales: ${globalCommands.length}`);
    if (globalCommands.length > 0) {
      console.table(
        globalCommands.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          permissions: c.defaultMemberPermissions || "Tous",
          subcommands:
            c.options
              ?.filter((opt) => opt.type === 1 || opt.type === 2)
              .map((opt) => (opt.type === 2 ? `${opt.name} (group)` : opt.name))
              .join(", ") || "Aucune",
        }))
      );
    }

    // Commandes guildées (optionnel)
    if (guildId) {
      const guildCommands = (await rest.get(
        Routes.applicationGuildCommands(clientId, guildId)
      )) as ApplicationCommand[];
      
      logger.info(`\n🏰 Commandes de guilde (${guildId}): ${guildCommands.length}`);
      if (guildCommands.length > 0) {
        console.table(
          guildCommands.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            permissions: c.defaultMemberPermissions || "Tous",
            subcommands:
              c.options
                ?.filter((opt) => opt.type === 1 || opt.type === 2)
                .map((opt) => (opt.type === 2 ? `${opt.name} (group)` : opt.name))
                .join(", ") || "Aucune",
          }))
        );
      }
    }

    // Résumé
    logger.info("\n📊 Résumé:");
    logger.info(`   - Mode de déploiement actuel: ${isGuildDeployment ? `Guilde (${guildId})` : "Global"}`);
    logger.info(`   - Commandes globales: ${globalCommands.length}`);
    if (guildId) {
      const guildCommands = (await rest.get(
        Routes.applicationGuildCommands(clientId, guildId)
      )) as ApplicationCommand[];
      logger.info(`   - Commandes de guilde: ${guildCommands.length}`);
    }
    
  } catch (error) {
    logger.error("Erreur lors de la récupération des commandes :", { error });
  }
}

listCommands();
