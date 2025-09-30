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
    // Récupérer la ville d'abord
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Impossible de trouver la ville pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer l'utilisateur
    const dbUser = await apiService.getOrCreateUser(
      user.id,
      user.username,
      user.discriminator
    );

    // Essayer de récupérer le personnage actif
    try {
      const characterStatus = await apiService.checkCharacterStatus(user.id, interaction.guildId!, interaction.client);

      if (characterStatus.hasActiveCharacter && characterStatus.character) {
        const character = characterStatus.character;

        // Récupérer les points d'action du personnage
        const actionPointsData = await apiService.getActionPoints(character.id);

        // Calculer le temps restant avant la prochaine mise à jour
        const timeUntilUpdate = calculateTimeUntilNextUpdate();

        // Préparer les données pour l'affichage
        const profileData: ProfileData = {
          character: {
            id: character.id,
            name: character.name,
            roles: [], // TODO: Récupérer les rôles du personnage si disponibles
            hungerLevel: character.hungerLevel || 0,
          },
          actionPoints: {
            points: actionPointsData?.points || character.paTotal || 0,
            lastUpdated: actionPointsData?.lastUpdated || new Date(),
          },
          timeUntilUpdate,
          user: {
            id: user.id,
            username: user.username,
            displayAvatarURL: user.displayAvatarURL({ size: 128 }),
          },
          member: {
            nickname: member.nickname || null,
          },
        };

        // Créer l'embed du profil
        const embed = createProfileEmbed(profileData);

        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
        return;
      } else if (characterStatus.needsCreation) {
        await interaction.reply({
          content: "❌ Vous devez d'abord créer un personnage.",
          flags: ["Ephemeral"],
        });
        return;
      } else if (characterStatus.canReroll) {
        await interaction.reply({
          content: "⚠️ Votre personnage est mort. Utilisez la commande de reroll pour créer un nouveau personnage.",
          flags: ["Ephemeral"],
        });
        return;
      } else if (characterStatus.character) {
        // L'utilisateur a un personnage (mort ou vivant) mais pas de permission de reroll et pas de personnage actif
        // Afficher le profil du personnage
        const character = characterStatus.character;

        // Récupérer les points d'action du personnage
        const actionPointsData = await apiService.getActionPoints(character.id);

        // Calculer le temps restant avant la prochaine mise à jour
        const timeUntilUpdate = calculateTimeUntilNextUpdate();

        // Préparer les données pour l'affichage
        const profileData: ProfileData = {
          character: {
            id: character.id,
            name: character.name,
            roles: [], // TODO: Récupérer les rôles du personnage si disponibles
            hungerLevel: character.hungerLevel || 0,
          },
          actionPoints: {
            points: actionPointsData?.points || character.paTotal || 0,
            lastUpdated: actionPointsData?.lastUpdated || new Date(),
          },
          timeUntilUpdate,
          user: {
            id: user.id,
            username: user.username,
            displayAvatarURL: user.displayAvatarURL({ size: 128 }),
          },
          member: {
            nickname: member.nickname || null,
          },
        };

        // Créer l'embed du profil
        const embed = createProfileEmbed(profileData);

        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
        return;
      }
    } catch (error) {
      logger.warn("Erreur lors de la vérification du statut du personnage:", {
        userId: user.id,
        guildId: interaction.guildId,
        error: error instanceof Error ? error.message : error
      });
    }

    // Si on arrive ici, c'est qu'il y a un problème avec le statut du personnage
    await interaction.reply({
      content: "❌ Impossible de déterminer l'état de votre personnage. Veuillez contacter un administrateur.",
      flags: ["Ephemeral"],
    });

  } catch (error) {
    logger.error("Erreur lors de l'exécution de la commande profil:", {
      userId: user.id,
      guildId: interaction.guildId,
      error: error instanceof Error ? error.message : error
    });

    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'affichage de votre profil.",
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

  // Formatage des rôles (simplifié pour l'instant)
  const rolesText = "Aucun rôle"; // TODO: Implémenter si les rôles sont disponibles

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
      value: `${getActionPointsEmoji(data.actionPoints.points)} **${data.actionPoints.points}/4**`,
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
      return "Mort";
    case 1:
      return "Agonie";
    case 2:
      return "Affamé";
    case 3:
      return "Faim";
    case 4:
      return "En bonne santé";
    default:
      return "Inconnu";
  }
}

function getHungerColor(level: number): number {
  switch (level) {
    case 0:
      return 0x000000; // Noir - Mort
    case 1:
      return 0xff4500; // Rouge-orange - Agonie
    case 2:
      return 0xffa500; // Orange - Affamé
    case 3:
      return 0xffff00; // Jaune - Faim
    case 4:
      return 0x00ff00; // Vert - En bonne santé
    default:
      return 0x808080; // Gris - Inconnu
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
        text: `${baseEmoji} **${baseText}** - Incapable d'agir`,
        emoji: baseEmoji,
      };
    case 1:
      return {
        text: `${baseEmoji} **${baseText}** - Plus de régénération PA !`,
        emoji: baseEmoji,
      };
    case 2:
      return {
        text: `${baseEmoji} **${baseText}** - Régénération PA réduite`,
        emoji: baseEmoji,
      };
    case 3:
      return {
        text: `${baseEmoji} **${baseText}** - Commence à avoir faim`,
        emoji: baseEmoji,
      };
    case 4:
      return {
        text: `${baseEmoji} **${baseText}** - Parfait état !`,
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
      return "💀";
    case 1:
      return "😰";
    case 2:
      return "😕";
    case 3:
      return "🤤";
    case 4:
      return "😊";
    default:
      return "❓";
  }
}
