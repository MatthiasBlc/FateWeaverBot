import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { handleExpeditionAdminCommand } from "../../features/admin/expedition-admin.handlers";

// Commande admin pour gérer les expéditions (réservé aux admins)
const expeditionAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("expedition-admin")
    .setDescription("Administration des expéditions (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleExpeditionAdminCommand(interaction);
    } catch (error) {
      logger.error("Error in expedition admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default expeditionAdminCommand;
