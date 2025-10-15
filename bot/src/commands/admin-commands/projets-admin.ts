import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleAddProjectCommand,
  handleDeleteProjectCommand,
} from "../../features/projects/project-creation";

const projetsAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("projets-admin")
    .setDescription("Administration des projets artisanaux (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Action à effectuer")
        .setRequired(true)
        .addChoices(
          { name: "Ajouter un projet", value: "add" },
          { name: "Supprimer un projet", value: "delete" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const action = interaction.options.getString("action", true);

    try {
      if (action === "add") {
        await handleAddProjectCommand(interaction);
      } else if (action === "delete") {
        await handleDeleteProjectCommand(interaction);
      }
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
