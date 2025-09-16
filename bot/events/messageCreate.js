import { config } from "../config/config.js";
import { logger } from "../utils/logger.js";
import { parseCommand } from "../utils/helper.js";

export default {
  name: "messageCreate",
  once: false,
  async execute(client, message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const { name, args } = parseCommand(message.content, config.prefix);
    if (!name) return;

    const cmd = client.commands?.get(name);
    if (!cmd) return; // unknown command

    try {
      await cmd.execute(client, message, args);
    } catch (err) {
      logger.error(`Command '${name}' failed:`, err);
      await message.reply("❌ An error occurred while executing the command.");
    }
  },
};
