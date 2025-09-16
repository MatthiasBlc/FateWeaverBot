import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadEvents(client) {
  const eventsDir = path.join(__dirname, "..", "events");
  if (!fs.existsSync(eventsDir)) return;
  const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const filePath = path.join(eventsDir, file);
    const mod = await import(filePath);
    const event = mod.default || mod.event;
    if (!event?.name || typeof event.execute !== "function") {
      logger.warn(`Skipping event ${file} (invalid shape)`);
      continue;
    }
    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
    logger.info(
      `Registered event: ${event.name}${event.once ? " (once)" : ""}`
    );
  }
}
