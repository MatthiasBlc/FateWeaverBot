import { REST, Routes } from "discord.js";
import { readdir, stat } from "fs/promises";
import { join, resolve } from "path";
import { logger } from "./services/logger";
import { config, validateConfig } from "./config/index";

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

// --- Command Loading Logic ---
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
        logger.info(`   -> Chargement du fichier: ${entry.name}`);
        const commandModule = (await import(fullPath)).default;
        if (commandModule?.data && commandModule?.execute) {
          commands.push(commandModule.data.toJSON());
          logger.info(
            `      ✅ Commande '${commandModule.data.name}' chargée.`
          );
        } else {
          logger.warn(
            `      ⚠️  Fichier ${entry.name} ignoré (pas de 'data' ou 'execute').`
          );
        }
      } catch (error) {
        logger.error(`      ❌ Erreur lors du chargement de ${entry.name}:`, {
          error,
        });
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
        logger.info(`   -> Chargement du fichier: ${entry.name}`);
        const commandModule = (await import(fullPath)).default;
        if (commandModule?.data && commandModule?.execute) {
          commands.push(commandModule.data.toJSON());
          logger.info(
            `      ✅ Commande '${commandModule.data.name}' chargée.`
          );
        } else {
          logger.warn(
            `      ⚠️  Fichier ${entry.name} ignoré (pas de 'data' ou 'execute').`
          );
        }
      } catch (error) {
        logger.error(`      ❌ Erreur lors du chargement de ${entry.name}:`, {
          error,
        });
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
          logger.info(`   -> Chargement du fichier: ${entry.name}/${file.name}`);
          const commandModule = (await import(fullPath)).default;
          if (commandModule?.data && commandModule?.execute) {
            commands.push(commandModule.data.toJSON());
            logger.info(
              `      ✅ Commande '${commandModule.data.name}' chargée.`
            );
          } else {
            logger.warn(
              `      ⚠️  Fichier ${entry.name}/${file.name} ignoré (pas de 'data' ou 'execute').`
            );
          }
        } catch (error) {
          logger.error(`      ❌ Erreur lors du chargement de ${entry.name}/${file.name}:`, {
            error,
          });
        }
      }
    }
  }
  return commands;
}

// --- Main Execution ---
(async () => {
  try {
    logger.info("--- Démarrage du déploiement des commandes ---");
    logger.info(
      isGuildDeployment ? `Mode: Guilde (${guildId})` : "Mode: Global"
    );

    logger.info("🔍 Chargement des fichiers de commandes...");
    const commandsPath = resolve(process.cwd(), "src", "commands");
    const commands = await loadCommandsFromCommands(commandsPath);

    // Load commands from features directory (similar to index.ts logic)
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

    logger.info("🗑️  Nettoyage des anciennes commandes sur Discord...");
    // Using PUT with an empty array is the official way to bulk delete all commands.
    await rest.put(route, { body: [] });
    // await rest.put(Routes.applicationCommands(clientId), { body: [] });
    logger.info("✅ Nettoyage terminé.");

    logger.info(
      `✍️  Enregistrement des ${commands.length} nouvelles commandes...`
    );
    // We can use a single PUT now that loading is confirmed to be stable.
    await rest.put(route, { body: commands });

    logger.info("--- ✅ Déploiement terminé avec succès ---");
    process.exit(0);
  } catch (error) {
    logger.error(
      "--- ❌ Une erreur critique est survenue lors du déploiement ---",
      { error }
    );
    process.exit(1);
  }
})();
