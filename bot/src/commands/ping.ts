import type { Command } from "../types/command.js";

export const command: Command = {
  name: "ping",
  description: "Répond avec Pong 🏓",
  async execute(_client, message, _args) {
    await message.reply("Pong 🏓 !");
  },
};

export default command;
