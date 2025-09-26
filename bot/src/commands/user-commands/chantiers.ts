import { SlashCommandBuilder, PermissionFlagsBits, type CommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleListCommand,
  handleInvestCommand,
} from "../../features/chantiers/chantiers.handlers";

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

export default chantiersUserCommand;
