import type { Command } from "../types/command.js";

export const command: Command = {
  name: "help",
  description: "List all available commands",
  async execute(client, message) {
    const names = client.commands ? Array.from(client.commands.keys()) : [];
    const content = names.length
      ? `Available commands: ${names.map((n) => `\`${n}\``).join(", ")}`
      : "No commands registered.";
    await message.reply(content);
  },
};

export default command;
