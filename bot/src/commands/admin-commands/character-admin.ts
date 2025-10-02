import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { handleCharacterAdminCommand } from "../../features/admin/character-admin.handlers";

// Commande admin pour gérer les personnages (réservé aux admins)
const characterAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("character-admin")
    .setDescription("Administration des personnages (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleCharacterAdminCommand(interaction);
    } catch (error) {
      logger.error("Error in character admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default characterAdminCommand;
