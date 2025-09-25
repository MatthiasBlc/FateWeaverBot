import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { Command } from "../types/command";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste des commandes utilisateur disponibles"),

  async execute(interaction) {
    try {
      // Créer un embed pour un affichage plus joli
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("📚 Aide - Commandes utilisateur")
        .setDescription("Voici la liste des commandes disponibles :")
        .addFields(
          {
            name: "⚙️ Commandes de base",
            value:
              "```\n" +
              "/ping - Vérifie que le bot est en ligne\n" +
              "/profil - Affiche votre profil utilisateur\n" +
              "/help - Affiche ce message d'aide" +
              "\n```",
            inline: false,
          },
          {
            name: "🏗️ Commandes des chantiers",
            value:
              "```\n" +
              "/chantiers liste - Affiche la liste des chantiers\n" +
              "/chantiers build - Investir des points dans un chantier" +
              "\n```",
            inline: false,
          },
          {
            name: "❓ Besoin d'aide supplémentaire ?",
            value:
              "Contactez un administrateur du serveur pour toute question ou problème.",
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Demandé par ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in help command:", error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Une erreur est survenue lors de l'affichage de l'aide.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ Une erreur est survenue lors de l'affichage de l'aide.",
          ephemeral: true,
        });
      }
    }
  },
};

export default command;
