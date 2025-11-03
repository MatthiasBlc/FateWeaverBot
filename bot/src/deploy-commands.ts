/* eslint-disable @typescript-eslint/no-explicit-any */
import { REST, Routes, ApplicationCommand } from "discord.js";
import { readdir } from "fs/promises";
import { resolve } from "path";
import { logger } from "./services/logger";
import { config, validateConfig } from "./config/index";
import { STATUS, SYSTEM } from "./constants/emojis";

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

// --- Helper Functions ---

/**
 * Nettoie un objet option en ne gardant que les propriétés pertinentes pour la comparaison
 */
function cleanOption(option: any): any {
  if (!option) return option;

  const cleaned: any = {
    type: option.type,
    name: option.name,
    description: option.description,
  };

  // Ajouter les propriétés optionnelles si elles existent
  if (option.required !== undefined) cleaned.required = option.required;
  if (option.choices !== undefined) cleaned.choices = option.choices;

  // Normaliser les options: [] et undefined sont équivalents
  if (option.options !== undefined && option.options.length > 0) {
    cleaned.options = option.options.map(cleanOption);
  }

  if (option.min_value !== undefined) cleaned.min_value = option.min_value;
  if (option.max_value !== undefined) cleaned.max_value = option.max_value;
  if (option.min_length !== undefined) cleaned.min_length = option.min_length;
  if (option.max_length !== undefined) cleaned.max_length = option.max_length;
  if (option.autocomplete !== undefined) cleaned.autocomplete = option.autocomplete;
  if (option.channel_types !== undefined) cleaned.channel_types = option.channel_types;

  return cleaned;
}

/**
 * Compare deux commandes pour déterminer si elles sont identiques
 */
function areCommandsEqual(local: any, remote: ApplicationCommand): boolean {
  // Comparer les propriétés essentielles
  if (local.name !== remote.name) {
    return false;
  }

  if (local.description !== remote.description) {
    return false;
  }

  // Comparer les options (sous-commandes, paramètres, etc.)
  // Nettoyer les options pour ne comparer que les propriétés pertinentes
  const localOptions = (local.options || []).map(cleanOption);
  const remoteOptions = (remote.options || []).map(cleanOption);

  const localOptionsStr = JSON.stringify(localOptions);
  const remoteOptionsStr = JSON.stringify(remoteOptions);

  if (localOptionsStr !== remoteOptionsStr) {
    return false;
  }

  // Note: On ne compare PAS les permissions par défaut car Discord ne les retourne
  // pas toujours dans l'API GET, même si elles sont bien appliquées.
  // Les permissions sont correctement appliquées lors du déploiement via PUT/PATCH.
  // Si vous modifiez les permissions d'une commande, changez aussi sa description
  // ou une option pour forcer la mise à jour.

  return true;
}

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
          // ---------------------------------------------------------------------------
          // ----------------------Ignorer les commandes désactivées--------------------
          // ---------------------------------------------------------------------------
          if ([''].includes(commandModule.data.name)) {
            logger.info(`      ${SYSTEM.FORWARD} Commande '${commandModule.data.name}' ignorée (désactivée temporairement).`);
            continue;
          }

          // ---------------------------------------------------------------------------
          // ----------------------Fin des commandes ignorées---------------------------
          // ---------------------------------------------------------------------------
          commands.push(commandModule.data.toJSON());
          logger.info(
            `      ${STATUS.SUCCESS} Commande '${commandModule.data.name}' chargée.`
          );
        } else {
          logger.warn(
            `      ${SYSTEM.WARNING} Fichier ${entry.name} ignoré (pas de 'data' ou 'execute').`
          );
        }
      } catch (error) {
        logger.error(`      ${STATUS.ERROR} Erreur lors du chargement de ${entry.name}:`, {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error,
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
          // ---------------------------------------------------------------------------
          // ----------------------Ignorer les commandes désactivées--------------------
          // ---------------------------------------------------------------------------
          if ([''].includes(commandModule.data.name)) {
            logger.info(`      ${SYSTEM.FORWARD} Commande '${commandModule.data.name}' ignorée (désactivée temporairement).`);
            continue;
          }
          // ---------------------------------------------------------------------------
          // ----------------------Fin des commandes ignorées---------------------------
          // ---------------------------------------------------------------------------
          commands.push(commandModule.data.toJSON());
          logger.info(
            `      ${STATUS.SUCCESS} Commande '${commandModule.data.name}' chargée.`
          );
        } else {
          logger.warn(
            `      ${SYSTEM.WARNING} Fichier ${entry.name} ignoré (pas de 'data' ou 'execute').`
          );
        }
      } catch (error) {
        logger.error(`      ${STATUS.ERROR} Erreur lors du chargement de ${entry.name}:`, {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error,
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
            // ---------------------------------------------------------------------------
            // ----------------------Ignorer les commandes désactivées--------------------
            // ---------------------------------------------------------------------------
            if ([''].includes(commandModule.data.name)) {
              logger.info(`      ${SYSTEM.FORWARD} Commande '${commandModule.data.name}' ignorée (désactivée temporairement).`);
              continue;
            }

            // ---------------------------------------------------------------------------
            // ----------------------Fin des commandes ignorées---------------------------
            // ---------------------------------------------------------------------------
            commands.push(commandModule.data.toJSON());
            logger.info(
              `      ${STATUS.SUCCESS} Commande '${commandModule.data.name}' chargée.`
            );
          } else {
            logger.warn(
              `      ⚠️  Fichier ${entry.name}/${file.name} ignoré (pas de 'data' ou 'execute').`
            );
          }
        } catch (error) {
          logger.error(`      ${STATUS.ERROR} Erreur lors du chargement de ${entry.name}/${file.name}:`, {
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              name: error.name
            } : error,
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

    logger.info(`${SYSTEM.SEARCH} Chargement des fichiers de commandes locales...`);
    const commandsPath = resolve(process.cwd(), "src", "commands");
    const localCommands = await loadCommandsFromCommands(commandsPath);

    // Load commands from features directory (similar to index.ts logic)
    const featuresPath = resolve(process.cwd(), "src", "features");
    const featureCommands = await loadCommandsFromFeatures(featuresPath);
    localCommands.push(...featureCommands);

    logger.info(`${STATUS.SUCCESS} ${localCommands.length} commandes locales chargées.`);

    if (localCommands.length === 0) {
      logger.warn("Aucune commande locale à déployer. Arrêt.");
      process.exit(0);
    }

    // Déterminer la route selon le mode de déploiement
    const route = isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId!)
      : Routes.applicationCommands(clientId);

    // Récupérer les commandes actuellement déployées sur Discord
    logger.info(`${SYSTEM.INBOX} Récupération des commandes déjà déployées sur Discord...`);
    const deployedCommands = (await rest.get(route)) as ApplicationCommand[];
    logger.info(`   -> ${deployedCommands.length} commandes actuellement déployées.`);

    // Créer des maps pour faciliter la comparaison
    const localCommandsMap = new Map(
      localCommands.map((cmd) => [cmd.name, cmd])
    );
    const deployedCommandsMap = new Map(
      deployedCommands.map((cmd) => [cmd.name, cmd])
    );

    // Identifier les commandes à créer, mettre à jour et supprimer
    const commandsToCreate: any[] = [];
    const commandsToUpdate: Array<{ id: string; data: any }> = [];
    const commandsToDelete: string[] = [];

    // Vérifier les commandes locales
    for (const [name, localCmd] of localCommandsMap) {
      const deployedCmd = deployedCommandsMap.get(name as string);

      if (!deployedCmd) {
        // Nouvelle commande à créer
        commandsToCreate.push(localCmd);
        logger.info(`   ${SYSTEM.PLUS} Nouvelle commande détectée: ${name}`);
      } else if (!areCommandsEqual(localCmd, deployedCmd)) {
        // Commande existante à mettre à jour
        commandsToUpdate.push({ id: deployedCmd.id, data: localCmd });
        logger.info(`   ${SYSTEM.REFRESH} Commande modifiée détectée: ${name}`);
      } else {
        logger.info(`   ✓ Commande inchangée: ${name}`);
      }
    }

    // Vérifier les commandes déployées qui n'existent plus localement
    for (const [name, deployedCmd] of deployedCommandsMap) {
      if (!localCommandsMap.has(name as string)) {
        commandsToDelete.push(deployedCmd.id);
        logger.info(`   ${SYSTEM.TRASH} Commande à supprimer: ${name}`);
      }
    }

    // Afficher le résumé
    logger.info(`\n${SYSTEM.CHART} Résumé des changements:`);
    logger.info(`   - Commandes à créer: ${commandsToCreate.length}`);
    logger.info(`   - Commandes à mettre à jour: ${commandsToUpdate.length}`);
    logger.info(`   - Commandes à supprimer: ${commandsToDelete.length}`);
    logger.info(`   - Commandes inchangées: ${localCommands.length - commandsToCreate.length - commandsToUpdate.length}`);

    const totalChanges = commandsToCreate.length + commandsToUpdate.length + commandsToDelete.length;

    if (totalChanges === 0) {
      logger.info(`${STATUS.SUCCESS} Aucun changement détecté. Déploiement non nécessaire.`);
      process.exit(0);
    }

    logger.info(`\n${SYSTEM.ROCKET} Application des ${totalChanges} changements...`);

    // Créer les nouvelles commandes
    for (const cmd of commandsToCreate) {
      try {
        await rest.post(route, { body: cmd });
        logger.info(`   ${STATUS.SUCCESS} Commande créée: ${cmd.name}`);
      } catch (error) {
        logger.error(`   ${STATUS.ERROR} Erreur lors de la création de ${cmd.name}:`, { error });
      }
    }

    // Mettre à jour les commandes modifiées
    for (const { id, data } of commandsToUpdate) {
      try {
        const updateRoute = isGuildDeployment
          ? Routes.applicationGuildCommand(clientId, guildId!, id)
          : Routes.applicationCommand(clientId, id);
        await rest.patch(updateRoute, { body: data });
        logger.info(`   ${STATUS.SUCCESS} Commande mise à jour: ${data.name}`);
      } catch (error) {
        logger.error(`   ${STATUS.ERROR} Erreur lors de la mise à jour de ${data.name}:`, { error });
      }
    }

    // Supprimer les commandes obsolètes
    for (const id of commandsToDelete) {
      try {
        const deleteRoute = isGuildDeployment
          ? Routes.applicationGuildCommand(clientId, guildId!, id)
          : Routes.applicationCommand(clientId, id);
        await rest.delete(deleteRoute);
        logger.info(`   ${STATUS.SUCCESS} Commande supprimée (ID: ${id})`);
      } catch (error) {
        logger.error(`   ${STATUS.ERROR} Erreur lors de la suppression de la commande ${id}:`, { error });
      }
    }

    logger.info(`\n--- ${STATUS.SUCCESS} Déploiement terminé avec succès ---`);
    logger.info(`${SYSTEM.BULB} Requêtes API économisées grâce au déploiement intelligent!`);
    process.exit(0);
  } catch (error) {
    logger.error(
      `--- ${STATUS.ERROR} Une erreur critique est survenue lors du déploiement ---`,
      { error }
    );
    process.exit(1);
  }
})();
