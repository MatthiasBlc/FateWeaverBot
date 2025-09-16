import type { Command } from "../types/command.js";

export const command: Command = {
  name: "template", // change this to your command name
  description: "Describe what this command does",
  async execute(_client, message, args) {
    await message.reply(`Template executed with args: ${args.join(" ")}`);
  },
};

export default command;
