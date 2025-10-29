import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { handleProjectsAdminCommand } from "../../features/admin/projects-admin.command";

// Commande admin unifiée pour gérer les projets artisanaux (réservé aux admins)
const projetsAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("projets-admin")
    .setDescription("Administration des projets artisanaux (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleProjectsAdminCommand(interaction);
    } catch (error) {
      logger.error("Error in projets admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default projetsAdminCommand;
