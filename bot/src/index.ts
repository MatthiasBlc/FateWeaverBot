import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Command } from "./types/command.js";
import { promises as fs } from "fs";
import { logger } from "./services/logger.js";
import { config, validateConfig } from "./config/index.js";

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as Client & { commands: Collection<string, Command> };

// Create a collection to store commands
client.commands = new Collection();

// Load commands
async function loadCommands() {
  try {
    // Load commands from commands directory
    const commandsPath = new URL("commands", import.meta.url);
    const commandFiles = (await fs.readdir(commandsPath)).filter(
      (file) =>
        (file.endsWith(".js") || file.endsWith(".ts")) && !file.startsWith("_")
    );

    for (const file of commandFiles) {
      const filePath = new URL(`commands/${file}`, import.meta.url);
      const commandModule = (await import(filePath.href)).default;

      // Handle both single commands and arrays of commands
      const commandsToProcess = Array.isArray(commandModule)
        ? commandModule
        : [commandModule];

      for (const command of commandsToProcess) {
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          logger.warn(
            `[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`
          );
        }
      }
    }

    // Load commands from user-commands directory
    const userCommandsPath = new URL("commands/user-commands", import.meta.url);
    const userCommandFiles = (await fs.readdir(userCommandsPath)).filter(
      (file) =>
        (file.endsWith(".js") || file.endsWith(".ts")) && !file.startsWith("_")
    );

    logger.info(`Loading ${userCommandFiles.length} user commands...`);
    for (const file of userCommandFiles) {
      const filePath = new URL(
        `commands/user-commands/${file}`,
        import.meta.url
      );
      const commandModule = (await import(filePath.href)).default;

      // Handle both single commands and arrays of commands
      const commandsToProcess = Array.isArray(commandModule)
        ? commandModule
        : [commandModule];

      for (const command of commandsToProcess) {
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          logger.warn(
            `[WARNING] The user command at ${filePath} is missing required "data" or "execute" property.`
          );
        }
      }
    }
    logger.info("UserCommands loaded successfully");

    // Load commands from admin-commands directory
    const adminCommandsPath = new URL(
      "commands/admin-commands",
      import.meta.url
    );
    const adminCommandFiles = (await fs.readdir(adminCommandsPath)).filter(
      (file) =>
        (file.endsWith(".js") || file.endsWith(".ts")) && !file.startsWith("_")
    );

    logger.info(`Loading ${adminCommandFiles.length} admin commands...`);
    for (const file of adminCommandFiles) {
      const filePath = new URL(
        `commands/admin-commands/${file}`,
        import.meta.url
      );
      const commandModule = (await import(filePath.href)).default;

      // Handle both single commands and arrays of commands
      const commandsToProcess = Array.isArray(commandModule)
        ? commandModule
        : [commandModule];

      for (const command of commandsToProcess) {
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          logger.warn(
            `[WARNING] The admin command at ${filePath} is missing required "data" or "execute" property.`
          );
        }
      }
    }
    logger.info("AdminCommands loaded successfully");

    // Load commands from features directory
    const featuresPath = new URL("features", import.meta.url);
    const featureDirs = (await fs.readdir(featuresPath)).filter(
      (file) => !file.endsWith(".ts") && !file.endsWith(".js")
    );

    for (const dir of featureDirs) {
      const featurePath = new URL(`features/${dir}`, import.meta.url);
      const featureFiles = (await fs.readdir(featurePath)).filter(
        (file) =>
          (file.endsWith(".js") || file.endsWith(".ts")) &&
          file.includes("command") &&
          !file.startsWith("_")
      );

      for (const file of featureFiles) {
        const filePath = new URL(`features/${dir}/${file}`, import.meta.url);
        const commandModule = (await import(filePath.href)).default;

        // Handle both single commands and arrays of commands
        const commandsToProcess = Array.isArray(commandModule)
          ? commandModule
          : [commandModule];

        for (const command of commandsToProcess) {
          if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
          } else {
            logger.warn(
              `[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`
            );
          }
        }
      }
    }

    logger.info("Commands loaded successfully");
  } catch (error) {
    logger.error("Error loading commands:", { error });
  }
}

// When the client is ready, run this code (only once)
client.once("clientReady", async () => {
  logger.info(`Logged in as ${client.user?.tag}!`);

  // Ne plus synchroniser automatiquement les commandes
  // Le déploiement des commandes est géré par deploy-commands.ts
  logger.info(
    "✅ Bot prêt. Les commandes sont déployées via le script deploy-commands.ts"
  );
});

// Listen for interactions (slash commands)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error("Error executing command:", { error });
    await interaction.reply({
      content: "There was an error executing this command!",
      flags: ["Ephemeral"],
    });
  }
});

// Validate configuration at startup
try {
  validateConfig();
} catch (error) {
  logger.error("Configuration validation failed:", { error });
  process.exit(1);
}

// Login to Discord with your client's token
client.login(config.discord.token);

// Load commands when starting
loadCommands().catch((e) =>
  logger.error("Error while loading commands:", { error: e })
);
