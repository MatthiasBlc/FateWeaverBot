import type { Command } from "../types/command.js";

export const command: Command = {
  name: "help",
  description: "Affiche la liste des commandes disponibles",
  async execute(client, message, _args) {
    const names = client.commands ? Array.from(client.commands.keys()) : [];
    const content = names.length
      ? `Commandes disponibles : ${names.map((n) => `\`${n}\``).join(", ")}`
      : "Aucune commande disponible.";
    await message.reply(content);
  },
};

export default command;
