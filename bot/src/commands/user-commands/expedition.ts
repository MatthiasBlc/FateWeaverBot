import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUserClean";
import {
  handleExpeditionStartCommand,
  handleExpeditionJoinCommand,
  handleExpeditionInfoCommand
} from "../../features/expeditions/expedition.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("expedition")
    .setDescription("Gérer les expéditions")
    .addSubcommand(subcommand =>
      subcommand
        .setName("start")
        .setDescription("Créer une nouvelle expédition")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("join")
        .setDescription("Rejoindre une expédition existante")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("info")
        .setDescription("Voir les informations de votre expédition")
    ),

  async execute(interaction: any) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "start":
        await withUser(handleExpeditionStartCommand)(interaction);
        break;
      case "join":
        await withUser(handleExpeditionJoinCommand)(interaction);
        break;
      case "info":
        await withUser(handleExpeditionInfoCommand)(interaction);
        break;
    }
  },
};

export default command;
