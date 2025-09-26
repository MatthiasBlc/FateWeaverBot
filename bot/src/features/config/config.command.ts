import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type CommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command.js";
import { logger } from "../../services/logger.js";
import { handleConfigChannelCommand } from "./config.handlers";

// Commande pour configurer le salon de logs
const configChannelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config_channel")
    .setDescription("Configure le salon pour les logs automatiques")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleConfigChannelCommand(interaction);
    } catch (error) {
      logger.error("Error in config_channel command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default configChannelCommand;
