import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { Command } from "../types/command.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste des commandes disponibles"),

  async execute(interaction) {
    try {
      // Créer un embed pour un affichage plus joli
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("📚 Aide - Commandes disponibles")
        .setDescription("Voici la liste des commandes disponibles :")
        .addFields(
          { name: "/ping", value: 'Répond avec "pong"', inline: true },
          { name: "/help", value: "Affiche ce message d'aide", inline: true }
          // Ajouter d'autres commandes ici au fur et à mesure
        )
        .setTimestamp()
        .setFooter({
          text: `Demandé par ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.reply({
        embeds: [embed],
        // ephemeral: true // Décommentez pour que seul l'utilisateur voie la réponse
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
