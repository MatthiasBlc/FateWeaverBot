import { SlashCommandBuilder, PermissionFlagsBits, type CommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";

// Commande admin help pour lister toutes les commandes admin disponibles
const adminHelpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Commandes d'administration (réservé aux admins)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Affiche la liste des commandes administrateur disponibles")
    ),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "help") {
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle("📋 Commandes Administrateur")
          .setDescription("Liste des commandes réservées aux administrateurs du serveur")
          .addFields(
            {
              name: "🔧 `/config_channel`",
              value: "Configure le salon pour les logs automatiques",
              inline: false
            },
            {
              name: "🏗️ `/chantiers-admin add`",
              value: "Ajouter un nouveau chantier (nom, coût requis)",
              inline: false
            },
            {
              name: "🏗️ `/chantiers-admin delete`",
              value: "Supprimer un chantier existant",
              inline: false
            },
            {
              name: "📋 `/admin help`",
              value: "Affiche cette liste d'aide",
              inline: false
            }
          )
          .setTimestamp()
          .setFooter({ text: "FateWeaver Bot - Interface Administrateur" });

        await interaction.reply({
          embeds: [embed],
          flags: ["Ephemeral"]
        });
      }
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
