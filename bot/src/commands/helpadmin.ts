import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import type { Command } from "../types/command";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("helpadmin")
    .setDescription(
      "Affiche la liste des commandes réservées aux administrateurs"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    try {
      // Vérifier si l'utilisateur a les permissions d'administrateur
      if (
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
      ) {
        await interaction.reply({
          content:
            "❌ Vous n'avez pas la permission d'utiliser cette commande.",
          ephemeral: true,
        });
        return;
      }

      // Créer un embed pour les commandes administrateur
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("🛠️ Aide - Commandes Administrateur")
        .setDescription(
          "Voici la liste des commandes réservées aux administrateurs :"
        )
        .addFields(
          {
            name: "🏗️ Gestion des chantiers",
            value:
              "```\n" +
              "/addch [nom] [coût] - Ajoute un nouveau chantier\n" +
              "/delch [id] - Supprime un chantier existant" +
              "\n```",
            inline: false,
          },
          {
            name: "🔧 Autres commandes",
            value:
              "```\n" +
              "/helpadmin - Affiche ce message d'aide administrateur" +
              "\n```",
            inline: false,
          },
          {
            name: "\u200B",
            value:
              "*Ces commandes sont réservées aux administrateurs du serveur.*",
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
      console.error("Error in helpadmin command:", error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "❌ Une erreur est survenue lors de l'affichage de l'aide administrateur.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "❌ Une erreur est survenue lors de l'affichage de l'aide administrateur.",
          ephemeral: true,
        });
      }
    }
  },
};

export default command;
