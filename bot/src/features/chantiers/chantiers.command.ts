import { SlashCommandBuilder, PermissionFlagsBits, type CommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleListCommand,
  handleInvestCommand,
  handleAddCommand,
  handleDeleteCommand,
} from "./chantiers.handlers";

// Commande utilisateur (sans permissions admin)
const chantiersUserCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("chantiers")
    .setDescription("Gère les chantiers du serveur")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("liste")
        .setDescription("Affiche la liste des chantiers")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("build")
        .setDescription("Investir des points dans un chantier")
    ),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "liste") {
        await handleListCommand(interaction);
      } else if (subcommand === "build") {
        await handleInvestCommand(interaction);
      }
    } catch (error) {
      logger.error("Error in chantiers user command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

// Commande admin (avec permissions admin)
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

  async execute(interaction: CommandInteraction) {
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

export default [chantiersUserCommand, chantiersAdminCommand];
