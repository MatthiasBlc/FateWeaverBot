import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Command } from "./types/command.js";
import { promises as fs } from "fs";

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
    // Utilisation de new URL pour les chemins en ES modules
    const commandsPath = new URL("commands", import.meta.url);
    const commandFiles = (await fs.readdir(commandsPath)).filter(
      (file) =>
        (file.endsWith(".js") || file.endsWith(".ts")) && !file.startsWith("_")
    );

    for (const file of commandFiles) {
      const filePath = new URL(`commands/${file}`, import.meta.url);
      const command = (await import(filePath.href)).default as Command;

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`
        );
      }
    }
    console.log("Commands loaded successfully");
  } catch (error) {
    console.error("Error loading commands:", error);
  }
}

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

// Listen for interactions (slash commands)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

// Login to Discord with your client's token
if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is not defined in environment variables");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);

// Load commands when starting
loadCommands().catch(console.error);
