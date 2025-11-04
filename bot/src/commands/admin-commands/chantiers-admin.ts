import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleChantiersAdminCommand,
} from "../../features/chantiers/handlers/index.js";

// Commande admin (avec permissions Discord Administrator pour la visibilité)
const chantiersAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("chantiers-admin")
    .setDescription("Administration des chantiers (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleChantiersAdminCommand(interaction);
    } catch (error) {
      logger.error("Error in chantiers admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default chantiersAdminCommand;
