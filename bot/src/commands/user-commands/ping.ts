import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Répond avec pong!"),

  async execute(interaction) {
    await interaction.reply("pong");
  },
};

// Note: Nous n'appliquons pas withCharacterCheck au ping car c'est une commande de test
// qui doit fonctionner même sans personnage

export default command;
