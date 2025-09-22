import {
  ApplicationCommandType,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import apiClient from "../services/database.js";
import { Command } from "../types/command.js";

export const ProfileCommand: Command = {
  name: "profile",
  description: "Affiche vos informations de joueur",
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: CommandInteraction) => {
    try {
      // Mettre à jour ou créer l'utilisateur via l'API
      const user = await apiClient.upsertUser({
        discordId: interaction.user.id,
        username: interaction.user.username,
        globalName: interaction.user.globalName || null,
        avatar: interaction.user.avatarURL() || null,
      });

      // Récupérer les informations complètes du profil
      const profile = await apiClient.getUserProfile(interaction.user.id);

      // Créer un embed pour afficher les informations
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Profil de ${user.username}`)
        .setThumbnail(user.avatar || interaction.user.displayAvatarURL())
        .addFields(
          {
            name: "Points d'action (PA)",
            value: profile.pa.toString(),
            inline: true,
          },
          { name: "ID Discord", value: user.discordId, inline: true },
          {
            name: "Inscrit le",
            value: new Date(user.createdAt).toLocaleDateString("fr-FR"),
            inline: true,
          }
        )
        .setTimestamp();

      // Ajouter le nom global s'il existe
      if (user.globalName) {
        embed.setAuthor({ name: user.globalName });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(
        "Erreur lors de l'exécution de la commande /profile :",
        error
      );

      let errorMessage = "Une erreur inconnue est survenue";

      if (error instanceof Error) {
        // Si c'est une erreur standard
        errorMessage = error.message;
      } else if (error && typeof error === "object" && "response" in error) {
        // Si c'une erreur Axios
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      } else if (typeof error === "string") {
        // Si c'est une simple chaîne
        errorMessage = error;
      }

      await interaction.reply({
        content: `❌ Erreur: ${errorMessage}`,
        ephemeral: true,
      });
    }
  },
};

export default ProfileCommand;
