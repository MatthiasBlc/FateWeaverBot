import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { Command } from "../types/command";
import { apiService } from "../services/api";
import { AxiosError } from "axios";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche ou crée votre profil utilisateur"),

  async execute(interaction) {
    try {
      // Différer la réponse pour avoir plus de temps
      await interaction.deferReply({ ephemeral: true });

      const discordId = interaction.user.id;
      const username = interaction.user.username;

      // Récupérer ou créer l'utilisateur
      const user = await apiService.getOrCreateUser(discordId, username);

      // Créer un embed pour afficher les informations du profil
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("👤 Profil utilisateur")
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: "Nom d'utilisateur", value: user.username, inline: true },
          { name: "ID Discord", value: user.discordId, inline: true },
          {
            name: "Date de création",
            value: new Date(user.createdAt).toLocaleDateString("fr-FR"),
            inline: true,
          }
        )
        .setFooter({
          text: `Profil mis à jour le ${new Date().toLocaleString("fr-FR")}`,
        });

      // Ajouter des champs supplémentaires si disponibles
      if (user.email) {
        embed.addFields({ name: "Email", value: user.email, inline: true });
      }

      if (user.roles && user.roles.length > 0) {
        embed.addFields({
          name: "Rôles",
          value: user.roles.join(", "),
          inline: false,
        });
      }

      // Répondre avec l'embed
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Erreur dans la commande /profil:", error);

      let errorMessage =
        "❌ Une erreur est survenue lors de la récupération de votre profil.";

      if (error instanceof AxiosError && error.response) {
        // Erreur de l'API
        errorMessage += `\n\`\`\`${
          error.response.data?.message || error.message
        }\`\`\``;
      }

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  },
};

export default command;
