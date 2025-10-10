import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import {
  handleStockAdminCommand,
  handleStockAdminViewButton,
  handleStockAdminAddButton,
  handleStockAdminRemoveButton,
  handleStockAdminAddSelect,
  handleStockAdminRemoveSelect,
  handleStockAdminAddModal,
  handleStockAdminRemoveModal,
} from "../../features/admin/stock-admin.command";

// Commande admin unifiée pour gérer tous les stocks de ressources (réservé aux admins)
const stockAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("stock-admin")
    .setDescription(
      "Administration unifiée des stocks de ressources (réservé aux admins)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleStockAdminCommand(interaction);
    } catch (error) {
      logger.error("Error in stock admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default stockAdminCommand;
