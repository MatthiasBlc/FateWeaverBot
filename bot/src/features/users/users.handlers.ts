import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import {
  checkAndPromptReroll,
  createRerollModal,
} from "../../modals/character-modals";
import type { ProfileData, ActionPointsData, ActionPointsResponse } from "./users.types";
import {
  calculateTimeUntilNextUpdate,
  formatTimeUntilUpdate,
  getActionPointsEmoji,
} from "./users.utils";
import { getCharacterCapabilities } from "../../services/capability.service";
import { httpClient } from "../../services/httpClient";

export async function handleProfileCommand(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Récupérer la ville d'abord
    const town = (await apiService.getTownByGuildId(interaction.guildId!)) as {
      id: string;
    } | null;

    if (!town || typeof town !== "object" || !("id" in town)) {
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
      const characterStatus = await apiService.checkCharacterStatus(
        user.id,
        interaction.guildId!,
        interaction.client
      );

      interface ActionPointsData {
        points: number;
        lastUpdated: string;
      }

      type ActionPointsResponse = {
        success: boolean;
        data: ActionPointsData | null;
      };

      // Cas spécial : personnage mort qui ne peut pas reroll mais existe dans characterStatus.character
      if (characterStatus.character && characterStatus.character.isDead && !characterStatus.character.canReroll) {
        const character = characterStatus.character;
        console.log(
          `[BOT /profil] Personnage mort détecté SANS permission de reroll: ${character.id}`
        );

        // Calculer le temps restant avant la prochaine mise à jour
        const timeUntilUpdate = calculateTimeUntilNextUpdate();

        // Préparer les données pour l'affichage d'un personnage mort
        const profileData: ProfileData = {
          character: {
            id: character.id,
            name: character.name,
            roles: character.roles || [],
            hungerLevel: character.hungerLevel, // Utilise la valeur du backend (devrait être 0)
            hp: character.hp, // Utilise la valeur du backend (devrait être 0)
            pm: character.pm, // Utilise la valeur du backend (devrait être 0)
            capabilities: [], // Personnage mort n'a pas de capacités actives
          },
          actionPoints: {
            points: 0, // Personnage mort = 0 PA (pas stocké en base pour les morts)
            lastUpdated: new Date(),
          },
          timeUntilUpdate,
          user: {
            id: user.id,
            discordId: user.id, // L'ID Discord est le même que l'ID utilisateur dans Discord.js
            username: user.username,
            displayAvatarURL: user.displayAvatarURL({ size: 128 }),
          },
          member: {
            nickname: member.nickname || null,
            roles: member.roles.cache
              .filter(role => role.name !== '@everyone' && role.name !== 'everyone')
              .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
              })),
          },
        };

        // Créer l'embed du profil avec les valeurs à 0
        const { embed } = createProfileEmbed(profileData);

        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
        return;
      }

      if (characterStatus.hasActiveCharacter && characterStatus.character) {
        const character = characterStatus.character;

        // Calculer le temps restant avant la prochaine mise à jour
        const timeUntilUpdate = calculateTimeUntilNextUpdate();

        // Vérifier si le personnage actif est mort et peut reroll
        if (characterStatus.canReroll && character) {
          console.log(
            `[BOT /profil] Personnage mort détecté avec permission de reroll: ${character.id}`
          );

          logger.info(
            "Personnage mort actif détecté, ouverture directe de la modale de reroll",
            {
              characterId: character.id,
              userId: user.id,
              guildId: interaction.guildId,
            }
          );

          // Ouvrir directement la modale de reroll SANS nettoyer d'abord
          // Le système de reroll se chargera de nettoyer l'ancien personnage
          const modal = createRerollModal();
          await interaction.showModal(modal);
          return;
        }

        // Récupérer les capacités du personnage
        const capabilities = await getCharacterCapabilities(character.id);

        // Récupérer les points d'action du personnage
        const actionPointsResponse = (await apiService.getActionPoints(
          character.id
        )) as ActionPointsResponse;
        const actionPointsData = actionPointsResponse.data;

        // Préparer les données pour l'affichage avec les rôles récupérés du personnage
        const profileData: ProfileData = {
          character: {
            id: character.id,
            name: character.name,
            roles: character.roles || [],
            hungerLevel: character.hungerLevel || 0,
            hp: character.hp || 5,
            pm: character.pm || 5,
            capabilities: capabilities.map(cap => ({
              id: cap.id,
              name: cap.name,
              description: cap.description,
              costPA: cap.costPA,
            })),
          },
          actionPoints: {
            points: actionPointsData?.points || character.paTotal || 0,
            lastUpdated: actionPointsData?.lastUpdated
              ? new Date(actionPointsData.lastUpdated)
              : new Date(),
          },
          timeUntilUpdate,
          user: {
            id: user.id,
            discordId: user.id, // L'ID Discord est le même que l'ID utilisateur dans Discord.js
            username: user.username,
            displayAvatarURL: user.displayAvatarURL({ size: 128 }),
          },
          member: {
            nickname: member.nickname || null,
            roles: member.roles.cache
              .filter(role => role.name !== '@everyone' && role.name !== 'everyone')
              .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
              })),
          },
        };

        // Créer l'embed du profil
        const { embed, components } = createProfileEmbed(profileData);

        await interaction.reply({ embeds: [embed], components, flags: ["Ephemeral"] });
        return;
      } else if (characterStatus.needsCreation) {
        await interaction.reply({
          content: "❌ Vous devez d'abord créer un personnage.",
          flags: ["Ephemeral"],
        });
        return;
      } else if (characterStatus.canReroll) {
        await interaction.reply({
          content:
            "⚠️ Votre personnage est mort. Utilisez la commande de reroll pour créer un nouveau personnage.",
          flags: ["Ephemeral"],
        });
        return;
      }
    } catch (error) {
      logger.warn("Erreur lors de la vérification du statut du personnage:", {
        userId: user.id,
        guildId: interaction.guildId,
        error: error instanceof Error ? error.message : error,
      });
    }

    // Si on arrive ici, c'est qu'il y a un problème avec le statut du personnage
    await interaction.reply({
      content:
        "❌ Impossible de déterminer l'état de votre personnage. Veuillez contacter un administrateur.",
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de l'exécution de la commande profil:", {
      userId: user.id,
      guildId: interaction.guildId,
      error: error instanceof Error ? error.message : error,
    });

    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de l'affichage de votre profil.",
      flags: ["Ephemeral"],
    });
  }
}

function createProfileEmbed(data: ProfileData): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
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

  // Formatage des rôles avec mentions Discord comme dans l'ancienne version
  const rolesText =
    data.character.roles && data.character.roles.length > 0
      ? data.character.roles.map((role: { discordId: string; name: string }) => `<@&${role.discordId}>`).join(", ")
      : "Aucun rôle";

  // Formatage des rôles Discord de l'utilisateur
  const discordRolesText =
    data.member.roles && data.member.roles.length > 0
      ? data.member.roles.map(role => `<@&${role.id}>`).join(", ")
      : "Aucun rôle";

  // Formatage avancé de l'état de faim
  const hungerDisplay = createAdvancedHungerDisplay(data.character.hungerLevel);

  // Panneau d'attention pour les PA élevés (3 ou 4)
  const attentionPanel =
    data.actionPoints.points >= 3
      ? {
        name: "⚠️ **ATTENTION**",
        value: `Vous avez **${data.actionPoints.points} PA** ! Pensez à les utiliser avant la prochaine régénération.`,
        inline: false,
      }
      : null;

  // Ajout des champs d'information
  const fields = [
    {
      name: "Nom",
      value: data.character.name || "Non défini",
      inline: true,
    },
    {
      name: "Rôles",
      value: discordRolesText,
      inline: true,
    },

    {
      name: "Points d'Action (PA)",
      value: `**${data.actionPoints.points || 0}/4**`,
      inline: true,
    },
    {
      name: "Points de vie (PV)",
      value: createPVDisplay(data.character.hp, 5),
      inline: true,
    },
    {
      name: "Points mentaux (PM)",
      value: createHeartDisplay(data.character.pm, 5, '💜', '🖤'),
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
    },
  ];

  // Ajouter la section capacités si elles existent
  if (data.character.capabilities && data.character.capabilities.length > 0) {
    fields.push({
      name: "🔮 **CAPACITÉS CONNUES**",
      value: createCapabilitiesDisplay(data.character.capabilities),
      inline: false,
    });
  }

  // Ajouter le panneau d'attention s'il y en a un
  if (attentionPanel) {
    fields.splice(3, 0, attentionPanel);
  }

  embed.addFields(fields);

  // Créer les composants (boutons d'action rapide) si le personnage a des capacités
  const components: ActionRowBuilder<ButtonBuilder>[] = [];
  if (data.character.capabilities && data.character.capabilities.length > 0) {
    const capabilityButtons = createCapabilityButtons(
      data.character.capabilities,
      data.user.discordId, // Utiliser l'ID Discord au lieu de l'ID interne
      data.character.id
    );
    if (capabilityButtons) {
      components.push(capabilityButtons);
    }
  }

  return { embed, components };
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

function createHeartDisplay(current: number, max: number, filledEmoji = '❤️', emptyEmoji = '🖤'): string {
  const hearts = [];

  for (let i = 0; i < max; i++) {
    if (i < current) {
      hearts.push(filledEmoji);
    } else {
      hearts.push(emptyEmoji);
    }
  }

  return hearts.join(' ');
}

function createPVDisplay(current: number, max: number): string {
  // Cas spécial : 1 seul PV restant = cœur pansé
  if (current === 1) {
    const hearts = ['❤️‍🩹']; // Cœur avec pansement

    // Ajouter les cœurs vides restants
    for (let i = 1; i < max; i++) {
      hearts.push('🖤');
    }

    return hearts.join(' ');
  }

  // Cas normal : utiliser la fonction standard
  return createHeartDisplay(current, max);
}

export async function handleProfileButtonInteraction(interaction: any) {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  // Vérifier si c'est un bouton de capacité
  if (customId.startsWith('use_capability:')) {
    const [, capabilityId, characterId, userId] = customId.split(':');

    console.log('DEBUG: Bouton capacité cliqué:', {
      customId,
      capabilityId,
      characterId,
      userId,
      currentUserId: interaction.user.id
    });

    try {
      // Vérifier que l'utilisateur qui clique est bien le propriétaire du profil
      if (interaction.user.id !== userId) {
        console.log('DEBUG: Échec vérification propriétaire:', {
          expected: userId,
          actual: interaction.user.id
        });
        await interaction.reply({
          content: "❌ Vous ne pouvez utiliser que vos propres capacités.",
          flags: ["Ephemeral"]
        });
        return;
      }

      await interaction.deferReply({ flags: ["Ephemeral"] });

      // Récupérer les détails de la capacité
      const capabilities = await getCharacterCapabilities(characterId);
      const selectedCapability = capabilities.find(cap => cap.id === capabilityId);

      if (!selectedCapability) {
        await interaction.editReply("❌ Capacité non trouvée.");
        return;
      }

      // Récupérer le personnage pour vérifier les PA
      const characterService = new (await import("../../services/api/character-api.service")).CharacterAPIService(httpClient);
      const character = await characterService.getCharacterById(characterId);

      if (!character) {
        await interaction.editReply("❌ Personnage non trouvé.");
        return;
      }

      // Vérifier que le personnage appartient à l'utilisateur
      if (!character.user || character.user.discordId !== userId) {
        console.log('DEBUG: Échec vérification propriétaire personnage:', {
          characterUserId: character.userId,
          characterDiscordId: character.user?.discordId,
          expectedUserId: userId,
          actualUserId: interaction.user.id
        });
        await interaction.editReply("❌ Vous ne pouvez utiliser que vos propres capacités.");
        return;
      }

      // Vérifier que le personnage n'est pas mort
      if (character.isDead) {
        await interaction.editReply("❌ Vous ne pouvez pas utiliser de capacités avec un personnage mort.");
        return;
      }

      // Vérifier les PA
      if (character.paTotal < selectedCapability.costPA) {
        await interaction.editReply(
          `❌ Vous n'avez pas assez de PA (${character.paTotal}/${selectedCapability.costPA} requis).`
        );
        return;
      }

      // Exécuter la capacité
      const seasonResponse = await httpClient.get('/seasons/current');
      const currentSeason = seasonResponse.data;
      const isSummer = currentSeason?.name?.toLowerCase() === 'summer';

      const response = await httpClient.post(`/characters/${characterId}/capabilities/use`, {
        capabilityId: capabilityId,
        isSummer
      });

      const result = response.data;

      // Afficher le résultat
      if (result.publicMessage && interaction.channel) {
        await interaction.channel.send(result.publicMessage);
      }

      await interaction.editReply({
        content: `✅ **${selectedCapability.name}** utilisée avec succès !\n${result.message || ''}`
      });

    } catch (error: any) {
      console.error("Erreur lors de l'utilisation de capacité via bouton:", error);
      await interaction.editReply({
        content: `❌ Erreur : ${error.message || 'Une erreur est survenue'}`
      });
    }
  }
}

function createCapabilitiesDisplay(capabilities: Array<{ name: string; description?: string; costPA: number; }> | undefined): string {
  if (!capabilities || capabilities.length === 0) {
    return "Aucune capacité connue";
  }

  // Déterminer l'emoji selon le nom de la capacité
  const getEmojiForCapability = (name: string): string => {
    switch (name.toLowerCase()) {
      case 'chasser': return '🏹';
      case 'cueillir': return '🌿';
      case 'pêcher': return '🎣';
      case 'divertir': return '🎭';
      default: return '🔮';
    }
  };

  return capabilities.map(cap =>
    `${getEmojiForCapability(cap.name)} **${cap.name}** (${cap.costPA} PA)${cap.description ? `\n   ${cap.description}` : ''}`
  ).join('\n');
}

function createCapabilityButtons(capabilities: Array<{ id: string; name: string; costPA: number; }>, userId: string, characterId: string): ActionRowBuilder<ButtonBuilder> | null {
  if (!capabilities || capabilities.length === 0) {
    return null;
  }

  // Limiter à 4 boutons maximum (limite Discord)
  const buttonsToShow = capabilities.slice(0, 4);

  const buttons = buttonsToShow.map(cap => {
    // Déterminer l'emoji selon le nom de la capacité
    const getEmojiForCapability = (name: string): string => {
      switch (name.toLowerCase()) {
        case 'chasser': return '🏹';
        case 'cueillir': return '🌿';
        case 'pêcher': return '🎣';
        case 'divertir': return '🎭';
        default: return '🔮';
      }
    };

    return new ButtonBuilder()
      .setCustomId(`use_capability:${cap.id}:${characterId}:${userId}`)
      .setLabel(`${cap.name} (${cap.costPA}PA)`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(getEmojiForCapability(cap.name));
  });

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
}
