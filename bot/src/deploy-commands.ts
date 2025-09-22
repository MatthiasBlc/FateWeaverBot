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

// Deploy commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

try {
  console.log(
    `🔄 Started refreshing ${commands.length} application (/) commands.`
  );

  const data = (await rest.put(
    process.env.DISCORD_GUILD_ID
      ? Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID
        )
      : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
    { body: commands }
  )) as unknown[];

  console.log(
    `✅ Successfully reloaded ${data.length} application (/) commands.`
  );
  process.exit(0);
} catch (error) {
  console.error("❌ Error deploying commands:");
  console.error(error);
  process.exit(1);
}
