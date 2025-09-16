import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Client } from "discord.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadEvents(client: Client) {
  const eventsDir = path.join(__dirname, "..", "events");
  console.log(`[DEBUG] Looking for events in: ${eventsDir}`);

  if (!fs.existsSync(eventsDir)) {
    console.error(`[ERROR] Events directory not found: ${eventsDir}`);
    return;
  }

  const files = fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
  console.log(`[DEBUG] Found event files:`, files);

  for (const file of files) {
    try {
      const filePath = path.join(eventsDir, file);
      console.log(`[DEBUG] Loading event from: ${filePath}`);

      const mod: unknown = await import(filePath);
      console.log(`[DEBUG] Imported event module:`, Object.keys(mod));

      const candidate = mod as {
        default?: {
          name: string;
          once?: boolean;
          execute: (...args: unknown[]) => unknown;
        };
        event?: {
          name: string;
          once?: boolean;
          execute: (...args: unknown[]) => unknown;
        };
      };

      const event = candidate.default ?? candidate.event;

      if (!event?.name || typeof event.execute !== "function") {
        console.warn(`[WARN] Skipping event ${file} (invalid shape)`, event);
        continue;
      }

      console.log(
        `[DEBUG] Registering event: ${event.name} (once: ${
          event.once || false
        })`
      );

      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }

      logger.info(`Loaded event: ${event.name}`);
    } catch (err) {
      console.error(`[ERROR] Failed to load event ${file}:`, err);
    }
  }

  console.log(`[DEBUG] Registered event listeners:`, client.eventNames());
}
