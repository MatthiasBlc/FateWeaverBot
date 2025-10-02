import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleAddCommand,
  handleDeleteCommand,
} from "../../features/chantiers/chantiers.handlers";

// Commande admin (avec permissions Discord Administrator pour la visibilité)
const chantiersAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("chantiers-admin")
    .setDescription("Administration des chantiers (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Ajouter un nouveau chantier")
        .addStringOption((option) =>
          option
            .setName("nom")
            .setDescription("Nom du chantier")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("cout")
            .setDescription("Coût total en points d'action")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Supprimer un chantier existant")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "add") {
        await handleAddCommand(interaction);
      } else if (subcommand === "delete") {
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
