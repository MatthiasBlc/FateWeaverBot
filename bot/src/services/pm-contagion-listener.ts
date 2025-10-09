/**
 * PM Contagion Listener
 *
 * This service listens for PM contagion events from the backend
 * and sends Discord log messages to the appropriate channels.
 *
 * The backend logs PM contagion events with structured data,
 * which this service picks up and formats for Discord.
 */

import { Client } from "discord.js";
import { httpClient } from "./httpClient";
import { logger } from "./logger";
import { sendLogMessage } from "../utils/channels";

/**
 * Poll the backend for PM contagion events
 * This is a simple implementation - can be improved with webhooks or message queue
 */
export async function setupPmContagionListener(client: Client) {
  // For now, we rely on the backend's logger.info("pm_contagion")
  // which already includes the message that should be sent to Discord.

  // The actual Discord log sending is handled by the backend cron job
  // using the existing logger system.

  // This file serves as a placeholder for future improvements:
  // - Real-time webhook listener
  // - Message queue consumer
  // - WebSocket connection to backend

  logger.info("PM contagion listener initialized (using backend logger)");
}

/**
 * Manual trigger for sending a PM contagion log message
 * Can be called from anywhere in the bot when PM contagion is detected
 */
export async function sendPmContagionLog(
  client: Client,
  guildId: string,
  data: {
    victimName: string;
    depressedName: string;
    location: string;
    newPmStatus: string;
  }
) {
  const message = `🌧️ La dépression se propage ${data.location} : **${data.victimName}** a perdu 1 PM à cause de **${data.depressedName}** et ${data.newPmStatus}.`;

  await sendLogMessage(guildId, client, message);
}
