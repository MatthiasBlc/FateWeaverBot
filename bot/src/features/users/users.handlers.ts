import { EmbedBuilder, type GuildMember } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import type { ProfileData } from "./users.types";
import {
  calculateTimeUntilNextUpdate,
  formatTimeUntilUpdate,
  getActionPointsEmoji,
} from "./users.utils";

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
    const actionPointsData = await apiService.getActionPoints(character.id);

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
        points: actionPointsData?.points || 0,
        lastUpdated: actionPointsData?.lastUpdated || new Date(),
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

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la récupération du profil:", { error });
    await interaction.reply({
      content:
        "Une erreur est survenue lors de la récupération de votre profil.",
      flags: ["Ephemeral"],
    });
  }
}

function createProfileEmbed(data: ProfileData): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(getHungerColor(data.character.hungerLevel))
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
      ? data.character.roles.map((role) => `<@&${role.discordId}>`).join(", ")
      : "Aucun rôle";

  // Formatage avancé de l'état de faim
  const hungerDisplay = createAdvancedHungerDisplay(data.character.hungerLevel);

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
      value: `${getActionPointsEmoji(data.actionPoints.points)} **${
        data.actionPoints.points || 0
      }/4**`,
      inline: true,
    },
    {
      name: "État de Faim",
      value: hungerDisplay.text,
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
    case 0:
      return "En bonne santé";
    case 1:
      return "Faim";
    case 2:
      return "Affamé";
    case 3:
      return "Agonie";
    case 4:
      return "Mort";
    default:
      return "Inconnu";
  }
}

function getHungerColor(level: number): number {
  switch (level) {
    case 0:
      return 0x00ff00; // Vert - bonne santé
    case 1:
      return 0xffff00; // Jaune - faim
    case 2:
      return 0xffa500; // Orange - affamé
    case 3:
      return 0xff4500; // Rouge-orange - agonie
    case 4:
      return 0x000000; // Noir - mort
    default:
      return 0x808080; // Gris - inconnu
  }
}

function createAdvancedHungerDisplay(level: number): {
  text: string;
  emoji: string;
} {
  const baseEmoji = getHungerEmoji(level);
  const baseText = getHungerLevelText(level);

  switch (level) {
    case 0:
      return {
        text: `${baseEmoji} **${baseText}** - Parfait état !`,
        emoji: baseEmoji,
      };
    case 1:
      return {
        text: `${baseEmoji} **${baseText}** - Commence à avoir faim`,
        emoji: baseEmoji,
      };
    case 2:
      return {
        text: `${baseEmoji} **${baseText}** - Régénération PA réduite`,
        emoji: baseEmoji,
      };
    case 3:
      return {
        text: `${baseEmoji} **${baseText}** - Plus de régénération PA !`,
        emoji: baseEmoji,
      };
    case 4:
      return {
        text: `${baseEmoji} **${baseText}** - Incapable d'agir`,
        emoji: baseEmoji,
      };
    default:
      return {
        text: `${baseEmoji} **État inconnu**`,
        emoji: baseEmoji,
      };
  }
}

function getHungerEmoji(level: number): string {
  switch (level) {
    case 0:
      return "😊";
    case 1:
      return "🤤";
    case 2:
      return "😕";
    case 3:
      return "😰";
    case 4:
      return "💀";
    default:
      return "❓";
  }
}
