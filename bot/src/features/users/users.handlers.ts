import { EmbedBuilder, type GuildMember } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import type { ProfileData } from "./users.types";
import { calculateTimeUntilNextUpdate, formatTimeUntilUpdate, getActionPointsEmoji } from "./users.utils";

export async function handleProfileCommand(interaction: any) {
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

    // Calculer le temps restant avant la prochaine mise à jour
    const timeUntilUpdate = calculateTimeUntilNextUpdate();

    // Préparer les données pour l'affichage
    const profileData: ProfileData = {
      character: {
        id: character.id,
        name: character.name,
        roles: character.roles || [],
        hungerLevel: character.hungerLevel || 0,
      },
      actionPoints: {
        points: actionPoints.points,
        lastUpdated: actionPoints.lastUpdated,
      },
      timeUntilUpdate,
      user: {
        id: user.id,
        username: user.username,
        displayAvatarURL: user.displayAvatarURL(),
      },
      member: {
        nickname: member.nickname || null,
      },
    };

    // Créer l'embed du profil
    const embed = createProfileEmbed(profileData);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error("Erreur lors de la récupération du profil:", { error });
    await interaction.reply({
      content: "Une erreur est survenue lors de la récupération de votre profil.",
      flags: ["Ephemeral"],
    });
  }
}

function createProfileEmbed(data: ProfileData): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle(`📋 Profil de ${data.character.name || "Sans nom"}`)
    .setThumbnail(data.user.displayAvatarURL)
    .addFields({
      name: "🎭 **INFORMATIONS DU PERSONNAGE**",
      value: "",
      inline: false,
    })
    .setFooter({
      text: `Profil de: ${data.character.name}`,
      iconURL: data.user.displayAvatarURL,
    })
    .setTimestamp();

  // Formatage des rôles
  const rolesText =
    data.character.roles && data.character.roles.length > 0
      ? data.character.roles
          .map((role) => `<@&${role.discordId}>`)
          .join(", ")
      : "Aucun rôle";

  // Formatage de l'état de faim
  const hungerText = getHungerLevelText(data.character.hungerLevel);
  const hungerEmoji = getHungerEmoji(data.character.hungerLevel);

  // Ajout des champs d'information
  embed.addFields(
    {
      name: "Nom",
      value: data.character.name || "Non défini",
      inline: true,
    },
    {
      name: "Rôles",
      value: rolesText,
      inline: true,
    },
    {
      name: "Points d'Action (PA)",
      value: `${getActionPointsEmoji(data.actionPoints.points)} **${data.actionPoints.points || 0}/4**`,
      inline: true,
    },
    {
      name: "État de faim",
      value: `${hungerEmoji} ${hungerText}`,
      inline: true,
    },
    {
      name: "Prochaine mise à jour",
      value: formatTimeUntilUpdate(data.timeUntilUpdate),
      inline: true,
    }
  );

  return embed;
}

function getHungerLevelText(level: number): string {
  switch (level) {
    case 0: return "En bonne santé";
    case 1: return "Faim";
    case 2: return "Affamé";
    case 3: return "Agonie";
    case 4: return "Mort";
    default: return "Inconnu";
  }
}

function getHungerEmoji(level: number): string {
  switch (level) {
    case 0: return "😊";
    case 1: return "😕";
    case 2: return "😰";
    case 3: return "🤤";
    case 4: return "💀";
    default: return "❓";
  }
}