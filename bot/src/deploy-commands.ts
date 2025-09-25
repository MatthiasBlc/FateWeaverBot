import { REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { logger } from "./services/logger";
import { config, validateConfig } from "./config/index";

// Validate configuration at startup
try {
  validateConfig();
} catch (error) {
  logger.error("Configuration validation failed:", { error });
  process.exit(1);
}

const guildId = config.discord.guildId?.trim(); // Supprime les espaces inutiles
const isGuildDeployment = guildId && guildId.length > 0; // Vérifie si la chaîne n'est pas vide

if (isGuildDeployment) {
  logger.info(`ℹ️  Déploiement en mode guilde (ID: ${guildId})`);
} else {
  logger.info(
    `ℹ️  Déploiement en mode global (DISCORD_GUILD_ID non défini ou vide)`
  );
}

const commands = [];

// Load all commands
try {
  const commandsPath = join(process.cwd(), "src", "commands");
  const commandFiles = (await readdir(commandsPath)).filter(
    (file) => file.endsWith(".ts") && !file.startsWith("_")
  );

  for (const file of commandFiles) {
    try {
      const filePath = join(commandsPath, file);
      const command = (await import(filePath)).default;

      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
        logger.info(`✅ Loaded command: ${command.data.name}`);
      } else {
        logger.warn(
          `⚠️  Command at ${file} is missing required "data" or "execute" property.`
        );
      }
    } catch (error) {
      logger.error(`❌ Error loading command ${file}:`, { error });
    }
  }

  // Load commands from features directory
  const featuresPath = join(process.cwd(), "src", "features");
  const featureDirs = (await readdir(featuresPath)).filter(
    (file) => !file.endsWith(".ts") && !file.endsWith(".js")
  );

  for (const dir of featureDirs) {
    const featurePath = join(featuresPath, dir);
    const featureFiles = (await readdir(featurePath)).filter(
      (file) => file.endsWith(".ts") && file.includes("command") && !file.startsWith("_")
    );

    for (const file of featureFiles) {
      try {
        const filePath = join(featurePath, file);
        const command = (await import(filePath)).default;

        if ("data" in command && "execute" in command) {
          commands.push(command.data.toJSON());
          logger.info(`✅ Loaded feature command: ${command.data.name}`);
        } else {
          logger.warn(
            `⚠️  Command at ${file} is missing required "data" or "execute" property.`
          );
        }
      } catch (error) {
        logger.error(`❌ Error loading feature command ${file}:`, { error });
      }
    }
  }
} catch (error) {
  logger.error("❌ Error reading commands directory:", { error });
  process.exit(1);
}

// Définition du type pour une commande Discord
interface DiscordCommand {
  id: string;
  application_id: string;
  name: string;
  description: string;
  version: string;
  default_permission: boolean;
  type?: number;
  // Ajoutez d'autres propriétés si nécessaire
}

// Deploy commands
const rest = new REST().setToken(config.discord.token);

const clientId = config.discord.clientId;

try {
  logger.info(`🔄 Démarrage du déploiement des commandes...`);

  // Déterminer la route en fonction du mode de déploiement
  const getCommandsRoute = (forceGlobal = false) =>
    !forceGlobal && isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId!)
      : Routes.applicationCommands(clientId);

  const getCommandRoute = (commandId: string, forceGlobal = false) =>
    !forceGlobal && isGuildDeployment
      ? Routes.applicationGuildCommand(clientId, guildId!, commandId)
      : Routes.applicationCommand(clientId, commandId);

  // 1. Nettoyer les commandes globales si on est en mode guilde
  if (isGuildDeployment) {
    try {
      logger.info("🔄 Nettoyage des commandes globales...");
      const globalCommands = (await rest.get(
        getCommandsRoute(true) // Force le mode global
      )) as DiscordCommand[];

      if (globalCommands.length > 0) {
        logger.info(
          `🗑️  Suppression de ${globalCommands.length} commandes globales existantes...`
        );
        await Promise.all(
          globalCommands.map((cmd) =>
            rest
              .delete(getCommandRoute(cmd.id, true)) // Force le mode global
              .catch((e) =>
                logger.error("Erreur suppression commande globale:", {
                  error: e,
                })
              )
          )
        );
        logger.info("✅ Nettoyage des commandes globales terminé");
      }
    } catch (error) {
      logger.warn("⚠️  Impossible de nettoyer les commandes globales :", {
        error,
      });
    }
  }

  // 2. Récupérer les commandes existantes (guilde ou globales)
  logger.info(`🔄 Récupération des commandes existantes...`);
  const existingCommands = (await rest.get(
    getCommandsRoute()
  )) as DiscordCommand[];

  // 3. Supprimer les commandes existantes
  logger.info(
    `🗑️  Suppression de ${existingCommands.length} commandes existantes...`
  );
  await Promise.all(
    existingCommands.map((cmd) =>
      rest
        .delete(getCommandRoute(cmd.id))
        .catch((e) =>
          logger.error("Erreur suppression commande existante:", { error: e })
        )
    )
  );

  // 4. Enregistrer les nouvelles commandes
  logger.info(`🔄 Enregistrement de ${commands.length} nouvelles commandes...`);
  const data = (await rest.put(getCommandsRoute(), {
    body: commands,
  })) as unknown[];

  logger.info(
    `✅ ${data.length} commandes ${
      isGuildDeployment ? "de guilde" : "globales"
    } déployées avec succès.`
  );
  process.exit(0);
} catch (error) {
  logger.error("❌ Erreur lors du déploiement des commandes :", { error });
  process.exit(1);
}
