import type { Command } from "../types/command.js";

export const command: Command = {
  name: "ping",
  description: "Replies with Pong 🏓",
  async execute(_client, message) {
    await message.reply("Pong 🏓 !");
  },
};

export default command;
