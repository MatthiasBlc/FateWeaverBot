import { REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { logger } from "./services/logger";
import { config, validateConfig } from "./config/index";
import { createHash } from "crypto";
import { readFile, writeFile } from "fs/promises";

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

const commands: DiscordCommand[] = [];

// Load all commands
try {
  const commandsPath = join(process.cwd(), "src", "commands");
  const commandFiles = (await readdir(commandsPath)).filter(
    (file) => file.endsWith(".ts") && !file.startsWith("_")
  );

  // Charger les commandes à la racine (si présentes)
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

  // Charger les commandes utilisateur
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

  // Charger les commandes admin
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

  // Charger les commandes issues des features (optionnel)
  try {
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
          const toProcess = Array.isArray(commandModule)
            ? commandModule
            : [commandModule];
          for (const cmd of toProcess) {
            if ("data" in cmd && "execute" in cmd) {
              commands.push(cmd.data.toJSON());
              logger.info(`✅ Loaded feature command: ${cmd.data.name}`);
            } else {
              logger.warn(
                `⚠️  Feature command at ${file} is missing required "data" or "execute" property.`
              );
            }
          }
        } catch (error) {
          logger.error(`❌ Error loading feature command ${file}:`, { error });
        }
      }
    }
  } catch {}
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
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const clientId = config.discord.clientId;
const hashFile = "/app/logs/commands.hash";

try {
  logger.info(`🔄 Démarrage du déploiement des commandes...`);

  // Déterminer les routes
  const getCommandsRoute = (forceGlobal = false) =>
    !forceGlobal && isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId!)
      : Routes.applicationCommands(clientId);

  const getCommandRoute = (commandId: string, forceGlobal = false) =>
    !forceGlobal && isGuildDeployment
      ? Routes.applicationGuildCommand(clientId, guildId!, commandId)
      : Routes.applicationCommand(clientId, commandId);

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

  // 3.5 Skip si aucun changement (hash)
  const hash = createHash("sha256")
    .update(JSON.stringify(commands))
    .digest("hex");
  try {
    const prev = (await readFile(hashFile, "utf8")).trim();
    if (prev === hash) {
      logger.info(
        "⏭️  Aucun changement détecté dans les commandes. Déploiement ignoré."
      );
      process.exit(0);
    }
  } catch {}

  // 4. Enregistrer les nouvelles commandes
  logger.info(`🔄 Enregistrement de ${commands.length} nouvelles commandes...`);
  logger.debug(
    "Noms des commandes envoyées:",
    commands.map((c: any) => c?.name)
  );

  // Timeout court et configurable pour accélérer les itérations dev
  const controller = new AbortController();
  const timeoutMs = Number(process.env.DEPLOY_TIMEOUT_MS || 20000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let deployed = 0;
  try {
    const data = (await rest.put(getCommandsRoute(), {
      body: commands,
      signal: controller.signal as unknown as AbortSignal,
    })) as unknown[];
    deployed = Array.isArray(data) ? data.length : 0;
    logger.info(
      `✅ ${deployed} commandes ${
        isGuildDeployment ? "de guilde" : "globales"
      } déployées avec succès.`
    );
    await writeFile(hashFile, hash, "utf8");
  } catch (e) {
    logger.warn(
      "⚠️ PUT bulk échoué/expiré. Passage en fallback upsert concurrent…",
      { error: e }
    );

    // Fallback: upsert (PATCH/POST) avec concurrence limitée
    const byName = new Map(existingCommands.map((c) => [c.name, c]));
    const concurrency = Math.max(
      1,
      Number(process.env.DEPLOY_CONCURRENCY || 3)
    );
    let inFlight = 0;
    let idx = 0;
    let success = 0;
    await new Promise<void>((resolve) => {
      const next = () => {
        if (idx >= commands.length && inFlight === 0) return resolve();
        while (inFlight < concurrency && idx < commands.length) {
          const cmd = commands[idx++] as any;
          inFlight++;
          (async () => {
            const existing = byName.get(cmd.name);
            try {
              if (existing) {
                await rest.patch(getCommandRoute(existing.id), { body: cmd });
                logger.info(`🔁 Commande mise à jour: ${cmd.name}`);
              } else {
                await rest.post(getCommandsRoute(), { body: cmd });
                logger.info(`➕ Commande créée: ${cmd.name}`);
              }
              success++;
            } catch (err) {
              logger.error(`❌ Échec upsert ${cmd.name}`, { error: err });
            } finally {
              inFlight--;
              next();
            }
          })();
        }
      };
      next();
    });
    deployed = success;
    logger.info(
      `✅ Upsert terminé: ${success}/${commands.length} commandes ok.`
    );
    if (success === commands.length) {
      await writeFile(hashFile, hash, "utf8");
    }
  } finally {
    clearTimeout(timeout);
  }

  // Repli global si en mode guilde et que rien n'a été déployé
  if (isGuildDeployment && deployed === 0) {
    logger.warn("⚠️ Aucune commande déployée en mode guilde. Repli GLOBAL…");
    const controller2 = new AbortController();
    const timeout2 = setTimeout(
      () => controller2.abort(),
      Math.max(20000, timeoutMs)
    );
    try {
      const data = (await rest.put(getCommandsRoute(true), {
        body: commands,
        signal: controller2.signal as unknown as AbortSignal,
      })) as unknown[];
      const count = Array.isArray(data) ? data.length : 0;
      logger.info(`✅ ${count} commandes globales déployées (repli).`);
    } catch (e2) {
      logger.warn("⚠️ PUT global échoué. Upsert global séquentiel…", {
        error: e2,
      });
      for (const cmd of commands as any[]) {
        try {
          await rest.post(getCommandsRoute(true), { body: cmd });
          logger.info(`➕ Commande globale créée: ${cmd.name}`);
        } catch (err) {
          logger.error(`❌ Échec création globale ${cmd.name}`, { error: err });
        }
      }
    } finally {
      clearTimeout(timeout2);
    }
  }

  logger.info(
    `🏁 Déploiement terminé (${isGuildDeployment ? "guilde" : "global"}${
      isGuildDeployment ? " avec fallback possible" : ""
    }).`
  );
  process.exit(0);
} catch (error) {
  logger.error("❌ Erreur lors du déploiement des commandes :", { error });
  process.exit(1);
}
