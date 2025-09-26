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
  logger.info(`ℹ️  Déploiement sur guilde spécifique (ID: ${guildId})`);
} else {
  logger.info(`ℹ️  Déploiement global (DISCORD_GUILD_ID non défini)`);
}

const commands = [];

// Load all commands
try {
  const commandsPath = join(process.cwd(), "src", "commands");
  const commandFiles = (await readdir(commandsPath)).filter(
    (file) => file.endsWith(".ts") && !file.startsWith("_")
  );

  // Load commands from user-commands directory
  const userCommandsPath = join(
    process.cwd(),
    "src",
    "commands",
    "user-commands"
  );
  const userCommandFiles = (await readdir(userCommandsPath)).filter(
    (file) => file.endsWith(".ts") && !file.startsWith("_")
  );

  logger.info(`Loading ${userCommandFiles.length} user commands...`);
  for (const file of userCommandFiles) {
    try {
      const filePath = join(userCommandsPath, file);
      const command = (await import(filePath)).default;

      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
        logger.info(`✅ Loaded user command: ${command.data.name}`);
      } else {
        logger.warn(
          `⚠️  User command at ${file} is missing required "data" or "execute" property.`
        );
      }
    } catch (error) {
      logger.error(`❌ Error loading user command ${file}:`, { error });
    }
  }

  // Load commands from admin-commands directory
  const adminCommandsPath = join(
    process.cwd(),
    "src",
    "commands",
    "admin-commands"
  );
  const adminCommandFiles = (await readdir(adminCommandsPath)).filter(
    (file) => file.endsWith(".ts") && !file.startsWith("_")
  );

  logger.info(`Loading ${adminCommandFiles.length} admin commands...`);
  for (const file of adminCommandFiles) {
    try {
      const filePath = join(adminCommandsPath, file);
      const command = (await import(filePath)).default;

      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
        logger.info(`✅ Loaded admin command: ${command.data.name}`);
      } else {
        logger.warn(
          `⚠️  Admin command at ${file} is missing required "data" or "execute" property.`
        );
      }
    } catch (error) {
      logger.error(`❌ Error loading admin command ${file}:`, { error });
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
      (file) =>
        file.endsWith(".ts") &&
        file.includes("command") &&
        !file.startsWith("_")
    );

    for (const file of featureFiles) {
      try {
        const filePath = join(featurePath, file);
        const commandModule = (await import(filePath)).default;

        // Handle both single commands and arrays of commands
        const commandsToProcess = Array.isArray(commandModule)
          ? commandModule
          : [commandModule];

        for (const command of commandsToProcess) {
          if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
            logger.info(`✅ Loaded feature command: ${command.data.name}`);
          } else {
            logger.warn(
              `⚠️  Command at ${file} is missing required "data" or "execute" property.`
            );
          }
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

  // 1. Nettoyer les commandes globales si on est en mode guilde spécifique
  if (isGuildDeployment) {
    try {
      logger.info(
        "🔄 Nettoyage des commandes globales avant déploiement sur guilde..."
      );
      const globalCommands = (await rest.get(
        Routes.applicationCommands(clientId)
      )) as DiscordCommand[];

      if (globalCommands.length > 0) {
        logger.info(
          `🗑️  Suppression de ${globalCommands.length} commandes globales existantes...`
        );
        // Supprimer toutes les commandes globales en parallèle
        await Promise.all(
          globalCommands.map((cmd) =>
            rest
              .delete(Routes.applicationCommand(clientId, cmd.id))
              .then(() =>
                logger.debug(
                  `Commande globale supprimée: ${cmd.name} (${cmd.id})`
                )
              )
              .catch((e) =>
                logger.warn(
                  `Échec de la suppression de la commande globale ${cmd.name}:`,
                  {
                    error: e.message,
                  }
                )
              )
          )
        );

        // Vérifier que toutes les commandes ont bien été supprimées
        const remainingCommands = (await rest.get(
          Routes.applicationCommands(clientId)
        )) as DiscordCommand[];

        if (remainingCommands.length > 0) {
          logger.warn(
            `⚠️  ${remainingCommands.length} commandes globales n'ont pas pu être supprimées`
          );
        } else {
          logger.info(
            "✅ Toutes les commandes globales ont été supprimées avec succès"
          );
        }
      } else {
        logger.info("✅ Aucune commande globale à nettoyer");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Erreur lors du nettoyage des commandes globales :", {
        error: errorMessage,
      });
      // Ne pas sortir en erreur pour ne pas bloquer le déploiement
    }
  }

  // 2. Récupérer les commandes existantes (uniquement sur la guilde si spécifiée, sinon globalement)
  logger.info(`🔄 Récupération des commandes existantes...`);
  const existingCommands = (await rest.get(
    isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId!)
      : Routes.applicationCommands(clientId)
  )) as DiscordCommand[];

  logger.info(
    `🗑️  Suppression de ${existingCommands.length} commandes existantes...`
  );
  await Promise.all(
    existingCommands.map((cmd) =>
      rest
        .delete(
          isGuildDeployment
            ? Routes.applicationGuildCommand(clientId, guildId!, cmd.id)
            : Routes.applicationCommand(clientId, cmd.id)
        )
        .catch((e) =>
          logger.error("Erreur suppression commande existante:", { error: e })
        )
    )
  );

  // 3. Enregistrer les nouvelles commandes
  logger.info(`🔄 Enregistrement de ${commands.length} nouvelles commandes...`);
  const data = (await rest.put(
    isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId!)
      : Routes.applicationCommands(clientId),
    {
      body: commands,
    }
  )) as unknown[];

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
