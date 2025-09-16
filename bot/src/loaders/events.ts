import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Client } from "discord.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadEvents(client: Client) {
  const eventsDir = path.join(__dirname, "..", "events");
  logger.debug("Recherche des événements dans: %s", eventsDir);

  if (!fs.existsSync(eventsDir)) {
    logger.error("Dossier des événements introuvable: %s", eventsDir);
    return;
  }

  const files = fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

  logger.debug("Fichiers d'événements trouvés: %O", files);

  for (const file of files) {
    try {
      const filePath = path.join(eventsDir, file);
      logger.debug("Chargement de l'événement depuis: %s", filePath);

      const mod: unknown = await import(filePath);
      const candidate = mod as {
        default?: {
          name: string;
          once?: boolean;
          execute: (client: Client, ...args: unknown[]) => Promise<void> | void;
        };
        event?: {
          name: string;
          once?: boolean;
          execute: (client: Client, ...args: unknown[]) => Promise<void> | void;
        };
      };

      const event = candidate.default ?? candidate.event;

      if (!event?.name || typeof event.execute !== "function") {
        logger.warn("Événement ignoré %s (format invalide): %O", file, event);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => {
          return event.execute(client, ...args);
        });
      } else {
        client.on(event.name, (...args) => {
          return event.execute(client, ...args);
        });
      }

      logger.info("Événement chargé: %s", event.name);
    } catch (err) {
      logger.error("Échec du chargement de l'événement %s: %O", file, err);
    }
  }

  logger.debug("Écouteurs d'événements enregistrés: %O", client.eventNames());
}
