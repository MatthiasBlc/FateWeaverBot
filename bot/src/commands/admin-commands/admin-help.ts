import { SlashCommandBuilder, PermissionFlagsBits, type CommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { createHelpEmbed, generateDynamicHelpSections } from "../../features/help/help.utils";

// Commande admin help pour lister toutes les commandes admin disponibles
const adminHelpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("admin-help")
    .setDescription("Affiche la liste des commandes administrateur disponibles")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      // Récupérer les commandes du client via l'interaction
      const client = interaction.client;
      const commands: any = client.commands; 
      const sections = commands
        ? generateDynamicHelpSections(commands, true)
        : [];

      const embed = createHelpEmbed({
        title: "📋 Commandes Administrateur",
        description: "Liste des commandes réservées aux administrateurs de la guilde",
        color: "#ff0000",
        sections: sections,
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL(),
      });

      await interaction.reply({
        embeds: [embed],
        flags: ["Ephemeral"]
      });
    } catch (error) {
      logger.error("Error in admin help command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default adminHelpCommand;
