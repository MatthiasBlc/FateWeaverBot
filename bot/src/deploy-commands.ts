import { REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  const commandFiles = (await readdir(commandsPath)).filter((file) =>
    file.endsWith(".ts")
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

  // 1. Récupérer toutes les commandes existantes
  console.log("🔄 Récupération des commandes existantes...");
  const existingCommands = (await rest.get(
    isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId)
  )) as DiscordCommand[];

  // 2. Supprimer toutes les commandes existantes
  console.log(
    `🗑️  Suppression de ${existingCommands.length} commandes existantes...`
  );
  await Promise.all(
    existingCommands.map((cmd) =>
      rest
        .delete(
          isGuildDeployment
            ? Routes.applicationGuildCommand(clientId, guildId, cmd.id)
            : Routes.applicationCommand(clientId, cmd.id)
        )
        .catch(console.error)
    )
  );

  // 3. Enregistrer les nouvelles commandes
  console.log(`🔄 Enregistrement de ${commands.length} nouvelles commandes...`);
  const data = (await rest.put(
    isGuildDeployment
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId),
    {
      body: commands,
    }
  )) as unknown[];

  console.log(
    `✅ ${data.length} commandes ${
      isGuildDeployment ? "(guilde)" : "(globales)"
    } déployées avec succès.`
  );
  process.exit(0);
} catch (error) {
  console.error("❌ Erreur lors du déploiement des commandes :");
  console.error(error);
  process.exit(1);
}
