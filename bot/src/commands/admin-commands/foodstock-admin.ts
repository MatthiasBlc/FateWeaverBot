import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleAddFoodCommand,
  handleRemoveFoodCommand,
} from "../../features/admin/food-admin.handlers";

// Commande admin pour gérer le stock de foodstock (réservé aux admins)
const foodAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("foodstock-admin")
    .setDescription("Administration du stock de foodstock (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Ajouter des foodstock à la ville")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Retirer des foodstock de la ville")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "add") {
        await handleAddFoodCommand(interaction);
      } else if (subcommand === "remove") {
        await handleRemoveFoodCommand(interaction);
      }
    } catch (error) {
      logger.error("Error in vivres admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default foodAdminCommand;
