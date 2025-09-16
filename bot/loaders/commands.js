import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(client) {
  const commandsDir = path.join(__dirname, "..", "commands");
  if (!fs.existsSync(commandsDir)) return;
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const filePath = path.join(commandsDir, file);
    const mod = await import(filePath);
    const command = mod.default || mod.command;
    if (!command?.name || typeof command.execute !== "function") {
      logger.warn(`Skipping command ${file} (invalid shape)`);
      continue;
    }
    client.commands.set(command.name, command);
    logger.info(`Loaded command: ${command.name}`);
  }
}
