import {
  SlashCommandBuilder,
  EmbedBuilder,
  type GuildMember,
} from "discord.js";
import type { Command } from "../types/command";
import { withUser } from "../middleware/ensureUser";
import { apiService } from "../services/api";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche votre profil et vos informations"),

  execute: withUser(async (interaction) => {
    const member = interaction.member as GuildMember;
    const user = interaction.user;

    try {
      // Récupérer les informations du personnage depuis la base de données
      const character = await apiService.getOrCreateCharacter(
        user.id,
        interaction.guildId!,
        interaction.guild?.name || "Serveur inconnu",
        {
          username: user.username,
          nickname: member.nickname || null,
          roles: member.roles.cache
            .filter((role) => role.id !== interaction.guildId) // Exclure le rôle @everyone
            .map((role) => role.id),
        },
        interaction.client
      );

      // Créer l'embed principal avec uniquement les informations de la base de données
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`📋 Profil de ${character.name || "Sans nom"}`)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({
          text: `ID: ${character.id}`,
          iconURL: user.displayAvatarURL(),
        })
        .setTimestamp();

      // Bloc Informations du Personnage (uniquement depuis la base de données)
      const rolesText =
        character.roles && character.roles.length > 0
          ? character.roles
              .map((role: { id: string; name: string; color: string }) => {
                return `<@&${role.id}>`;
              })
              .join(", ")
          : "Aucun rôle";

      embed.addFields(
        {
          name: "🎭 **INFORMATIONS DU PERSONNAGE**",
          value: "",
          inline: false,
        },
        {
          name: "Nom",
          value: character.name || "Non défini",
          inline: true,
        },
        {
          name: "Rôles",
          value: rolesText,
          inline: true,
        }
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la récupération du profil depuis la base de données.",
        ephemeral: true,
      });
    }
  }),
};

export default command;
