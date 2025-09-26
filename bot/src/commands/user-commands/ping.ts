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

export default command;
