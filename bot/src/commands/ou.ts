import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/command.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ou")
    .setDescription("Répond avec ici!"),

  async execute(interaction) {
    await interaction.reply("ici");
  },
};

export default command;
