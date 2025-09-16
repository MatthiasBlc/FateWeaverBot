import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Collection } from "discord.js";
import type { Client } from "discord.js";
import type { Command } from "../types/command.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(
  client: Client & { commands: Collection<string, Command> }
) {
  const commandsDir = path.join(__dirname, "..", "commands");
  logger.debug("Recherche des commandes dans: %s", commandsDir);

  if (!fs.existsSync(commandsDir)) {
    logger.error("Dossier des commandes introuvable: %s", commandsDir);
    return;
  }

  const files = fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

  logger.debug("Fichiers trouvés: %O", files);

  // Deduplicate by basename, prefer .ts
  const byBase = new Map<string, string>();

  for (const f of files) {
    const base = f.replace(/\.(js|ts)$/, "");
    const ext = path.extname(f);
    const existing = byBase.get(base);

    if (!existing || (ext === ".ts" && path.extname(existing) !== ".ts")) {
      byBase.set(base, f);
    }
  }

  logger.debug("Après déduplication: %O", Array.from(byBase.values()));

  for (const f of byBase.values()) {
    try {
      const filePath = path.join(commandsDir, f);
      logger.debug("Chargement de la commande depuis: %s", filePath);

      const mod: unknown = await import(filePath);
      const candidate = mod as { default?: Command; command?: Command };
      const command = candidate.default ?? candidate.command;

      if (!command?.name || typeof command.execute !== "function") {
        logger.warn("Commande ignorée %s (format invalide): %O", f, command);
        continue;
      }

      logger.debug("Enregistrement de la commande: %s", command.name);
      client.commands.set(command.name, command);
      logger.info("Commande chargée: %s", command.name);
    } catch (err) {
      logger.error("Échec du chargement de la commande %s: %O", f, err);
    }
  }

  logger.debug("Commandes chargées: %O", Array.from(client.commands.keys()));
}
