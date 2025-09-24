import {
  SlashCommandBuilder,
  EmbedBuilder,
  type GuildMember,
  time,
  TimestampStyles,
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

      // Récupérer les points d'action du personnage
      const actionPoints = await apiService.getActionPoints(
        character.id,
        interaction.token
      );

      // Calculer le temps restant avant la prochaine mise à jour (minuit prochain)
      const now = new Date();
      const nextUpdate = new Date(now);
      nextUpdate.setHours(24, 0, 0, 0); // Minuit prochain
      if (now >= nextUpdate) {
        nextUpdate.setDate(nextUpdate.getDate() + 1); // Si on est après minuit, prendre minuit du lendemain
      }
      const timeUntilUpdate = Math.floor(
        (nextUpdate.getTime() - now.getTime()) / 1000
      );

      // Créer l'embed principal
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`📋 Profil de ${character.name || "Sans nom"}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields({
          name: "🎭 **INFORMATIONS DU PERSONNAGE**",
          value: "",
          inline: false,
        })
        .setFooter({
          text: `Profil de: ${character.name}`,
          iconURL: user.displayAvatarURL(),
        })
        .setTimestamp();
      // Bloc Informations du Personnage (uniquement depuis la base de données)
      const rolesText =
        character.roles && character.roles.length > 0
          ? character.roles
              .map(
                (role: { discordId: string; name: string; color: string }) => {
                  return `<@&${role.discordId}>`;
                }
              )
              .join(", ")
          : "Aucun rôle";

      embed.addFields(
        {
          name: "Nom",
          value: character.name || "Non défini",
          inline: true,
        },
        {
          name: "Rôles",
          value: rolesText,
          inline: true,
        },
        {
          name: "Points d'Action (PA)",
          value: `${
            actionPoints.points === 0 ||
            actionPoints.points === 3 ||
            actionPoints.points === 4
              ? "⚠️"
              : ""
          } **${actionPoints.points || 0}/4**`,
          inline: true,
        },
        {
          name: "Prochaine mise à jour",
          value: `Dans ${Math.floor(timeUntilUpdate / 3600)}h ${Math.floor(
            (timeUntilUpdate % 3600) / 60
          )}m`,
          inline: true,
        }
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la récupération de votre profil.",
        ephemeral: true,
      });
    }
  }),
};

export default command;
