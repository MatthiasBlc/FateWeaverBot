import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { handleNewElementAdminCommand } from "../../features/admin/elements";

const newElementAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("new-element-admin")
    .setDescription("⚙️ [ADMIN] Ajouter une nouvelle capacité ou ressource")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleNewElementAdminCommand(interaction);
    } catch (error) {
      logger.error("Error in new-element-admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default newElementAdminCommand;
