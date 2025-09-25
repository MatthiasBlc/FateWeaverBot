import { REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";

// Vérification des variables d'environnement requises
const requiredEnvVars = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
  process.exit(1);
}

const guildId = process.env.DISCORD_GUILD_ID?.trim(); // Supprime les espaces inutiles
const isGuildDeployment = guildId && guildId.length > 0; // Vérifie si la chaîne n'est pas vide

if (isGuildDeployment) {
  console.log(`ℹ️  Déploiement en mode guilde (ID: ${guildId})`);
} else {
  console.log(
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
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.warn(
          `⚠️  Command at ${file} is missing required "data" or "execute" property.`
        );
      }
    } catch (error) {
      console.error(`❌ Error loading command ${file}:`, error);
    }
  }
} catch (error) {
  console.error("❌ Error reading commands directory:", error);
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
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

const clientId = process.env.DISCORD_CLIENT_ID!;

try {
  console.log(`🔄 Démarrage du déploiement des commandes...`);

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
      console.log("🔄 Nettoyage des commandes globales...");
      const globalCommands = (await rest.get(
        getCommandsRoute(true) // Force le mode global
      )) as DiscordCommand[];

      if (globalCommands.length > 0) {
        console.log(
          `🗑️  Suppression de ${globalCommands.length} commandes globales existantes...`
        );
        await Promise.all(
          globalCommands.map((cmd) =>
            rest
              .delete(getCommandRoute(cmd.id, true)) // Force le mode global
              .catch(console.error)
          )
        );
        console.log("✅ Nettoyage des commandes globales terminé");
      }
    } catch (error) {
      console.warn(
        "⚠️  Impossible de nettoyer les commandes globales :",
        error
      );
    }
  }

  // 2. Récupérer les commandes existantes (guilde ou globales)
  console.log(`🔄 Récupération des commandes existantes...`);
  const existingCommands = (await rest.get(
    getCommandsRoute()
  )) as DiscordCommand[];

  // 3. Supprimer les commandes existantes
  console.log(
    `🗑️  Suppression de ${existingCommands.length} commandes existantes...`
  );
  await Promise.all(
    existingCommands.map((cmd) =>
      rest.delete(getCommandRoute(cmd.id)).catch(console.error)
    )
  );

  // 4. Enregistrer les nouvelles commandes
  console.log(`🔄 Enregistrement de ${commands.length} nouvelles commandes...`);
  const data = (await rest.put(getCommandsRoute(), {
    body: commands,
  })) as unknown[];

  console.log(
    `✅ ${data.length} commandes ${
      isGuildDeployment ? "de guilde" : "globales"
    } déployées avec succès.`
  );
  process.exit(0);
} catch (error) {
  console.error("❌ Erreur lors du déploiement des commandes :");
  console.error(error);
  process.exit(1);
}
