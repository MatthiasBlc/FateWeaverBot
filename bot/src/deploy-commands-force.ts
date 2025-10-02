import { REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { resolve } from "path";
import { logger } from "./services/logger";
import { config, validateConfig } from "./config/index";

/**
 * Script de déploiement FORCÉ des commandes Discord
 * ⚠️ ATTENTION : Ce script supprime TOUTES les commandes et les redéploie
 * Utilisez-le uniquement en cas de problème avec le déploiement intelligent
 */

// --- Configuration and Setup ---
try {
  validateConfig();
} catch (error) {
  logger.error("Config validation failed:", { error });
  process.exit(1);
}

const clientId = config.discord.clientId;
const guildId = config.discord.guildId?.trim();
const isGuildDeployment = !!guildId;
const rest = new REST().setToken(config.discord.token);

// --- Command Loading Logic (réutilisé du deploy-commands.ts) ---
async function loadCommandsRecursively(dir: string): Promise<any[]> {
  const commands: any[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      commands.push(...(await loadCommandsRecursively(fullPath)));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) &&
      !entry.name.startsWith("_") &&
      entry.name !== "index.ts"
    ) {
      try {
        const commandModule = (await import(fullPath)).default;
        if (commandModule?.data && commandModule?.execute) {
          commands.push(commandModule.data.toJSON());
        }
      } catch (error) {
        logger.error(`Erreur lors du chargement de ${entry.name}:`, { error });
      }
    }
  }
  return commands;
}

async function loadCommandsFromCommands(dir: string): Promise<any[]> {
  const commands: any[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      commands.push(...(await loadCommandsRecursively(fullPath)));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) &&
      !entry.name.startsWith("_") &&
      entry.name !== "index.ts"
    ) {
      try {
        const commandModule = (await import(fullPath)).default;
        if (commandModule?.data && commandModule?.execute) {
          commands.push(commandModule.data.toJSON());
        }
      } catch (error) {
        logger.error(`Erreur lors du chargement de ${entry.name}:`, { error });
      }
    }
  }
  return commands;
}

async function loadCommandsFromFeatures(dir: string): Promise<any[]> {
  const commands: any[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const featurePath = resolve(dir, entry.name);
      const featureEntries = await readdir(featurePath, { withFileTypes: true });

      const commandFiles = featureEntries.filter(
        (file) =>
          file.isFile() &&
          (file.name.endsWith(".ts") || file.name.endsWith(".js")) &&
          file.name.includes("command") &&
          !file.name.startsWith("_")
      );

      for (const file of commandFiles) {
        const fullPath = resolve(featurePath, file.name);
        try {
          const commandModule = (await import(fullPath)).default;
          if (commandModule?.data && commandModule?.execute) {
            commands.push(commandModule.data.toJSON());
          }
        } catch (error) {
          logger.error(`Erreur lors du chargement de ${entry.name}/${file.name}:`, { error });
        }
      }
    }
  }
  return commands;
}

// --- Main Execution ---
(async () => {
  try {
    logger.warn("⚠️  --- DÉPLOIEMENT FORCÉ DES COMMANDES ---");
    logger.warn("⚠️  Ce script va SUPPRIMER et RECRÉER toutes les commandes");
    logger.info(
      isGuildDeployment ? `Mode: Guilde (${guildId})` : "Mode: Global"
    );

    logger.info("🔍 Chargement des fichiers de commandes...");
    const commandsPath = resolve(process.cwd(), "src", "commands");
    const commands = await loadCommandsFromCommands(commandsPath);

    const featuresPath = resolve(process.cwd(), "src", "features");
    const featureCommands = await loadCommandsFromFeatures(featuresPath);
    commands.push(...featureCommands);

    logger.info(`✅ ${commands.length} commandes chargées avec succès.`);

    if (commands.length === 0) {
      logger.warn("Aucune commande à déployer. Arrêt.");
      process.exit(0);
    }

    const route = isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId!)
      : Routes.applicationCommands(clientId);

    logger.info("🗑️  Suppression de TOUTES les anciennes commandes...");
    await rest.put(route, { body: [] });
    logger.info("✅ Suppression terminée.");

    logger.info(`✍️  Enregistrement des ${commands.length} nouvelles commandes...`);
    await rest.put(route, { body: commands });

    logger.info("--- ✅ Déploiement forcé terminé avec succès ---");
    process.exit(0);
  } catch (error) {
    logger.error(
      "--- ❌ Une erreur critique est survenue lors du déploiement ---",
      { error }
    );
    process.exit(1);
  }
})();
