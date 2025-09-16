import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Client, Collection } from "discord.js";
import type { Command } from "../types/command.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(
  client: Client & { commands: Collection<string, Command> }
) {
  const commandsDir = path.join(__dirname, "..", "commands");
  console.log(`[DEBUG] Looking for commands in: ${commandsDir}`);
  if (!fs.existsSync(commandsDir)) {
    console.error(`[ERROR] Commands directory not found: ${commandsDir}`);
    return;
  }

  const files = fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

  console.log(`[DEBUG] Found files:`, files);

  // Deduplicate by basename, prefer .ts
  const byBase = new Map<string, string>();
  for (const f of files) {
    const base = f.replace(/\.(js|ts)$/i, "");
    const existing = byBase.get(base);
    if (!existing) {
      byBase.set(base, f);
    } else if (existing.endsWith(".js") && f.endsWith(".ts")) {
      byBase.set(base, f);
    }
  }

  console.log(`[DEBUG] After deduplication:`, Array.from(byBase.values()));

  for (const f of byBase.values()) {
    try {
      const filePath = path.join(commandsDir, f);
      console.log(`[DEBUG] Loading command from: ${filePath}`);
      const mod: unknown = await import(filePath);
      console.log(`[DEBUG] Imported module:`, Object.keys(mod));
      const candidate = mod as { default?: Command; command?: Command };
      const command = candidate.default ?? candidate.command;

      if (!command?.name || typeof command.execute !== "function") {
        console.warn(`[WARN] Skipping command ${f} (invalid shape)`, command);
        continue;
      }

      console.log(`[DEBUG] Registering command: ${command.name}`);
      client.commands.set(command.name, command);
      logger.info(`Loaded command: ${command.name}`);
    } catch (err) {
      console.error(`[ERROR] Failed to load command ${f}:`, err);
    }
  }

  console.log(`[DEBUG] Loaded commands:`, Array.from(client.commands.keys()));
}
