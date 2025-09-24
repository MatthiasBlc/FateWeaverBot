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
          nickname: member.nickname || null,
          roles: member.roles.cache.map((role) => role.id),
        }
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
      embed.addFields(
        {
          name: "🎭 **INFORMATIONS DU PERSONNAGE**",
          value: "Ces informations sont stockées dans notre base de données",
          inline: false,
        },
        {
          name: "Nom",
          value: character.name || "Non défini",
          inline: true,
        },
        {
          name: "Rôle",
          value: character.role || "Non défini",
          inline: true,
        },
        {
          name: "Créé le",
          value: `<t:${Math.floor(
            new Date(character.createdAt).getTime() / 1000
          )}:D>`,
          inline: true,
        },
        {
          name: "Dernière mise à jour",
          value: `<t:${Math.floor(
            new Date(character.updatedAt).getTime() / 1000
          )}:R>`,
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
