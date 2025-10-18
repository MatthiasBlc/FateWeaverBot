import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleAddChantierCommand,
  handleDeleteCommand,
} from "../../features/chantiers/chantiers.handlers";

// Commande admin (avec permissions Discord Administrator pour la visibilité)
const chantiersAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("chantiers-admin")
    .setDescription("Administration des chantiers (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Action à effectuer")
        .setRequired(true)
        .addChoices(
          { name: "Ajouter un chantier", value: "add" },
          { name: "Supprimer un chantier", value: "delete" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const action = interaction.options.getString("action", true);

    try {
      if (action === "add") {
        await handleAddChantierCommand(interaction);
      } else if (action === "delete") {
        await handleDeleteCommand(interaction);
      }
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
