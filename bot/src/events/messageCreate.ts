import type { Client, Message, Collection } from "discord.js";
import type { Command } from "../types/command.js";
import { config } from "../config/config.js";
import { parseCommand } from "../utils/helper.js";
import { logger } from "../utils/logger.js";

export default {
  name: "messageCreate",
  once: false,
  async execute(client: Client, message: Message) {
    console.log(`[DEBUG] Message received: ${message.content}`);

    if (message.author.bot) {
      console.log("[DEBUG] Ignoring message from bot");
      return;
    }

    if (!message.content.startsWith(config.prefix)) {
      console.log(
        `[DEBUG] Message does not start with prefix '${config.prefix}'`
      );
      return;
    }

    console.log(`[DEBUG] Processing command: ${message.content}`);

    const command = parseCommand(message.content, config.prefix);
    if (!command) {
      console.log("[DEBUG] Failed to parse command");
      return;
    }

    const { name, args } = command;
    console.log(`[DEBUG] Command parsed - name: '${name}', args:`, args);

    const cmd = (
      client as Client & { commands: Collection<string, Command> }
    ).commands?.get(name);
    if (!cmd) {
      console.log(`[DEBUG] Command '${name}' not found in collection`);
      console.log(
        `[DEBUG] Available commands:`,
        Array.from(client.commands?.keys() || [])
      );
      return;
    }

    try {
      console.log(`[DEBUG] Executing command: ${name}`);
      await cmd.execute(client, message, args);
      console.log(`[DEBUG] Command '${name}' executed successfully`);
    } catch (err) {
      console.error(`[ERROR] Command '${name}' failed:`, err);
      logger.error(`Command '${name}' failed:`, err);
      await message.reply("❌ An error occurred while executing the command.");
    }
  },
};
