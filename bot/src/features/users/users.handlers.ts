import {
  CHARACTER,
  HUNGER,
  STATUS,
  CAPABILITIES,
  RESOURCES,
  RESOURCES_EXTENDED,
} from "../../constants/emojis.js";
import { ERROR_MESSAGES, INFO_MESSAGES } from "../../constants/messages.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { sendLogMessage } from "../../utils/channels";
import {
  checkAndPromptReroll,
  createRerollModal,
} from "../../modals/character-modals";
import type {
  ProfileData,
  ActionPointsData,
  ActionPointsResponse,
} from "./users.types";
import {
  calculateTimeUntilNextUpdate,
  formatTimeUntilUpdate,
  getActionPointsEmoji,
} from "./users.utils";
import { getCharacterCapabilities } from "../../services/capability.service";
import { formatErrorForLog } from "../../utils/errors";
import { httpClient } from "../../services/httpClient";
import { createCustomEmbed, getHungerColor } from "../../utils/embeds";

export async function handleProfileCommand(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Récupérer la ville d'abord
    const town = (await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    )) as {
      id: string;
    } | null;

    if (!town || typeof town !== "object" || !("id" in town)) {
      await interaction.reply({
        content: `${STATUS.ERROR} Impossible de trouver la ville pour ce serveur.`,
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
      if (
        characterStatus.character &&
        characterStatus.character.isDead &&
        !characterStatus.character.canReroll
      ) {
        const character = characterStatus.character;

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
            job: character.job || null, // Ajouter le métier
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
              .filter(
                (role) => role.name !== "@everyone" && role.name !== "everyone"
              )
              .map((role) => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
              })),
          },
        };

        // Créer l'embed du profil avec les valeurs à 0
        const { embed } = await createProfileEmbed(profileData);

        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
        return;
      }

      if (characterStatus.hasActiveCharacter && characterStatus.character) {
        const character = characterStatus.character;

        // Calculer le temps restant avant la prochaine mise à jour
        const timeUntilUpdate = calculateTimeUntilNextUpdate();

        // Vérifier si le personnage actif est mort et peut reroll
        if (characterStatus.canReroll && character) {
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
        const actionPointsResponse =
          (await apiService.characters.getActionPoints(
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
            job: character.job || null, // Ajouter le métier
            capabilities: capabilities.map((cap) => ({
              id: cap.id,
              name: cap.name,
              description: cap.description,
              costPA: cap.costPA,
              emojiTag: cap.emojiTag,
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
              .filter(
                (role) => role.name !== "@everyone" && role.name !== "everyone"
              )
              .map((role) => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
              })),
          },
        };

        // Créer l'embed du profil
        const { embed, components } = await createProfileEmbed(profileData);

        await interaction.reply({
          embeds: [embed],
          components,
          flags: ["Ephemeral"],
        });
        return;
      } else if (characterStatus.needsCreation) {
        await interaction.reply({
          content: `${STATUS.ERROR} Vous devez d'abord créer un personnage.`,
          flags: ["Ephemeral"],
        });
        return;
      } else if (characterStatus.canReroll) {
        await interaction.reply({
          content: INFO_MESSAGES.REROLL_PROMPT,
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
      content: INFO_MESSAGES.CHARACTER_STATUS_UNKNOWN,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de l'exécution de la commande profil:", {
      userId: user.id,
      guildId: interaction.guildId,
      error: error instanceof Error ? error.message : error,
    });

    await interaction.reply({
      content: INFO_MESSAGES.PROFILE_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

function createStatusDisplay(character: any): string | null {
  const statuses: string[] = [];

  // Si le personnage est mort, afficher uniquement "Mort"
  if (character.hp <= 0 || character.isDead) {
    return `${HUNGER.DEAD} **Mort**`;
  }

  // Satiété (niveau 4)
  if (character.hungerLevel === 4) {
    statuses.push(`${HUNGER.FED} **Satiété** : +1 ${CHARACTER.HP_FULL} / jour`);
  }

  // Agonie (niveau 1)
  if (character.hungerLevel === 1) {
    statuses.push(`${CHARACTER.HP_BANDAGED} **Agonie** : 0 PA utilisables`);
  }

  // Déprime (PM = 1)
  if (character.pm === 1) {
    statuses.push(
      `${CHARACTER.MP_DEPRESSED} **Déprime** : 1 seul PA utilisable / jour`
    );
  }

  // Dépression (PM = 0)
  if (character.pm === 0) {
    statuses.push(
      `${CHARACTER.MP_DEPRESSION} **Dépression** : 1 seul PA utilisable / jour + contamination`
    );
  }

  // Affamé (niveau 2)
  if (character.hungerLevel === 2) {
    statuses.push(`${HUNGER.STARVING} **Affamé** : -1 PA / jour`);
  }

  // Meurt de faim (niveau 0, mais déjà géré par mort)
  // Si niveau 0 et pas mort (mais normalement niveau 0 = mort)
  if (character.hungerLevel === 0 && !character.isDead) {
    statuses.push(
      `${HUNGER.AGONY} **Meurt de faim** : Agonie ${CHARACTER.HP_BANDAGED}`
    );
  }

  // Retourner la liste des statuts ou null si vide
  return statuses.length > 0 ? statuses.join("\n") : null;
}

async function createProfileEmbed(data: ProfileData): Promise<{
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
}> {
  const embed = createCustomEmbed({
    color: getHungerColor(data.character.hungerLevel),
    title: `${CHARACTER.PROFILE} ###${data.character.name || "Sans nom"}`,
    footer: {
      text: `Profil de: ${data.character.name}`,
      iconURL: data.user.displayAvatarURL,
    },
    timestamp: true,
  });

  // Formatage des rôles avec mentions Discord comme dans l'ancienne version
  const rolesText =
    data.character.roles && data.character.roles.length > 0
      ? data.character.roles
        .map(
          (role: { discordId: string; name: string }) =>
            `<@&${role.discordId}>`
        )
        .join(", ")
      : "Aucun rôle";

  // Formatage des rôles Discord de l'utilisateur
  const discordRolesText =
    data.member.roles && data.member.roles.length > 0
      ? data.member.roles.map((role) => `<@&${role.id}>`).join(", ")
      : "Aucun rôle";

  // Formatage avancé de l'état de faim
  const hungerEmoji = getHungerEmoji(data.character.hungerLevel);
  const hungerText = getHungerLevelText(data.character.hungerLevel);

  // Panneau d'attention pour les PA élevés (3 ou 4) - Supprimé, intégré dans l'affichage des PA
  // Ancienne logique supprimée ici

  // Ajout des champs d'information
  const jobText = data.character.job?.name || "Aucun métier";

  const fields = [
    {
      name: "Métier",
      value: jobText,
      inline: true,
    },
    {
      name: " ",
      value: " ",
      inline: true,
    },
    {
      name: "Points d'Action (PA)",
      value: `**${data.actionPoints.points || 0}/4 ${CHARACTER.PA}** ${data.actionPoints.points >= 3 ? STATUS.WARNING : " "
        }`.trim(),
      inline: true,
    },
    {
      name: "Vie (PV)",
      value: `${createPVDisplay(data.character.hp, 5)}`,
      inline: true,
    },
    {
      name: "Mental (PM)",
      value: `${createPMDisplay(data.character.pm, 5)}`,
      inline: true,
    },
    {
      name: `Faim`,
      value: `${hungerEmoji} **${hungerText}**`,
      inline: true,
    },
  ];

  // Créer le bloc Status
  const statusDisplay = createStatusDisplay(data.character);
  if (statusDisplay) {
    fields.push({
      name: `${CHARACTER.STATUS} **STATUTS**`,
      value: statusDisplay,
      inline: false,
    });
  }
  if (data.character.capabilities && data.character.capabilities.length > 0) {
    fields.push({
      name: `**CAPACITÉS**`,
      value: createCapabilitiesDisplay(data.character.capabilities),
      inline: false,
    });
  }

  // Ajouter tous les champs à l'embed en une seule fois
  embed.addFields(fields);

  // Ajouter l'inventaire (nouveau)
  try {
    const inventoryResponse = await httpClient.get(
      `/api/characters/${data.character.id}/inventory`
    );
    const inventory = inventoryResponse.data;

    if (inventory && inventory.slots && inventory.slots.length > 0) {
      const inventoryText = inventory.slots
        .map(
          (slot: any) =>
            `${slot.objectType.name}${slot.objectType.description
              ? ` • ${slot.objectType.description}`
              : ""
            }`
        )
        .join("\n");

      fields.push({
        name: `📦 **Inventaire**`,
        value: inventoryText,
        inline: false,
      });
    }
  } catch (error) {
    // Silencieusement ignorer les erreurs d'inventaire pour ne pas casser le profil
    logger.debug("Erreur lors de la récupération de l'inventaire:", error);
  }

  // Créer les composants (boutons d'action rapide) si le personnage a des capacités
  const components: ActionRowBuilder<ButtonBuilder>[] = [];
  if (data.character.capabilities && data.character.capabilities.length > 0) {
    const capabilityButtons = createCapabilityButtons(
      data.character.capabilities,
      data.user.discordId, // Utiliser l'ID Discord au lieu de l'ID interne
      data.character.id,
      data.actionPoints.points || 0 // Ajouter les PA actuels du personnage
    );
    if (capabilityButtons) {
      components.push(...capabilityButtons); // Étendre le tableau
    }
  }

  // Ajouter les boutons Manger si le personnage peut manger (niveau de faim < 4 et pas mort)
  if (data.character.hungerLevel < 4 && data.character.hungerLevel > 0) {
    // Créer les boutons disponibles selon le stock (vérification côté serveur lors du clic)
    const buttons = [];

    // // Bouton pour les vivres (toujours affiché si personnage peut manger)
    // const vivresButton = new ButtonBuilder()
    //   .setCustomId(`eat_food:${data.character.id}`)
    //   .setLabel("Manger 🍞 (1)")
    //   .setStyle(ButtonStyle.Primary);
    // buttons.push(vivresButton);

    // // Bouton pour la nourriture (toujours affiché si personnage peut manger)
    // const nourritureButton = new ButtonBuilder()
    //   .setCustomId(`eat_nourriture:${data.character.id}`)
    //   .setLabel("Manger 🍽️ (1)")
    //   .setStyle(ButtonStyle.Secondary);
    // buttons.push(nourritureButton);

    // Bouton "Manger +" pour accéder au menu avancé
    const eatMoreButton = new ButtonBuilder()
      .setCustomId(`eat_more:${data.character.id}`)
      .setLabel(`${RESOURCES_EXTENDED.FORK_KNIFE} Manger`)
      .setStyle(ButtonStyle.Success);
    buttons.push(eatMoreButton);

    // Ajouter les boutons à la ligne
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...buttons
    );
    components.push(buttonRow);
  }

  // Ajouter le bouton Cataplasme si le personnage est blessé (HP < 5 et pas mort)
  if (data.character.hp < 5 && data.character.hp > 0) {
    const cataplasmeButton = new ButtonBuilder()
      .setCustomId(`use_cataplasme:${data.character.id}`)
      .setLabel(`Utiliser Cataplasme ${RESOURCES_EXTENDED.BANDAGE}`)
      .setStyle(ButtonStyle.Danger);

    const cataplasmeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      cataplasmeButton
    );
    components.push(cataplasmeRow);
  }

  // Ajouter le bouton "Donner un objet" si le personnage a des objets dans son inventaire
  try {
    const inventoryResponse = await httpClient.get(
      `/api/characters/${data.character.id}/inventory`
    );
    const inventory = inventoryResponse.data;

    if (inventory && inventory.slots && inventory.slots.length > 0) {
      const giveObjectButton = new ButtonBuilder()
        .setCustomId(`give_object:${data.character.id}`)
        .setLabel(`🎁 Donner un objet`)
        .setStyle(ButtonStyle.Secondary);

      const giveObjectRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        giveObjectButton
      );
      components.push(giveObjectRow);
    }
  } catch (error) {
    // Silencieusement ignorer les erreurs
    logger.debug(
      "Erreur lors de la vérification de l'inventaire pour le bouton donner:",
      error
    );
  }

  // Ajouter le bouton "Projets" si le personnage a une capacité craft
  const craftCapabilities = data.character.capabilities?.filter((cap) =>
    ["Tisser", "Forger", "Menuiser"].includes(cap.name)
  );

  if (craftCapabilities && craftCapabilities.length > 0) {
    const projectsButton = new ButtonBuilder()
      .setCustomId(`view_projects:${data.character.id}:${data.user.discordId}`)
      .setLabel(`🛠️ Projets`)
      .setStyle(ButtonStyle.Primary);

    const projectsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      projectsButton
    );
    components.push(projectsRow);
  }

  return { embed, components };
}

function getHungerLevelText(level: number): string {
  switch (level) {
    case 0:
      return "Meurt de faim";
    case 1:
      return "Affamé";
    case 2:
      return "Faim";
    case 3:
      return "Petit creux";
    case 4:
      return "Satiété ";
    default:
      return "Inconnu";
  }
}

function getHungerEmoji(level: number): string {
  switch (level) {
    case 0:
      return HUNGER.STARVATION;
    case 1:
      return HUNGER.STARVING;
    case 2:
      return HUNGER.HUNGRY;
    case 3:
      return HUNGER.APPETITE;
    case 4:
      return HUNGER.FED;
    default:
      return HUNGER.UNKNOWN;
  }
}

function createHeartDisplay(
  current: number,
  max: number,
  filledEmoji = CHARACTER.HP_FULL,
  emptyEmoji = CHARACTER.HP_EMPTY
): string {
  const hearts = [];

  for (let i = 0; i < max; i++) {
    if (i < current) {
      hearts.push(filledEmoji);
    } else {
      hearts.push(emptyEmoji);
    }
  }

  return hearts.join(" ");
}

function createPVDisplay(current: number, max: number): string {
  // Cas spécial : 1 seul PV restant = cœur pansé
  if (current === 1) {
    const hearts: string[] = [CHARACTER.HP_BANDAGED]; // Cœur avec pansement

    // Ajouter les cœurs vides restants
    for (let i = 1; i < max; i++) {
      hearts.push(CHARACTER.HP_EMPTY);
    }

    return hearts.join(" ");
  }

  // Cas normal : utiliser la fonction standard
  return createHeartDisplay(current, max);
}

/**
 * Create PM (Mental Points) display with status text and special emojis
 * PM=0: Depression (rain cloud) - Cannot use PA + contagious
 * PM=1: Depressed (sad face) - Cannot use PA
 * PM=2-5: Normal purple hearts
 */
function createPMDisplay(current: number, max: number): string {
  const hearts = [];

  // Build hearts display (all empty for PM=0, normal for others)
  for (let i = 0; i < max; i++) {
    if (current === 0) {
      hearts.push(CHARACTER.MP_EMPTY); // All black for depression
    } else if (i < current) {
      hearts.push(CHARACTER.MP_FULL);
    } else {
      hearts.push(CHARACTER.MP_EMPTY);
    }
  }

  // Special case: PM=0 (Dépression)
  if (current === 0) {
    return `${hearts.join(" ")} - ${CHARACTER.MP_DEPRESSION
      }**Dépression** (Ne peut pas utiliser de PA, contagieux)`;
  }

  // Special case: PM=1 (Déprime)
  if (current === 1) {
    return `${hearts.join(" ")} - ${CHARACTER.MP_DEPRESSED
      }**Déprime** (Ne peut pas utiliser de PA)`;
  }

  // Normal case: PM=2-5
  return hearts.join(" ");
}

export async function handleProfileButtonInteraction(interaction: any) {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  // Vérifier si c'est un bouton de capacité
  if (customId.startsWith("use_capability:")) {
    const [, capabilityId, characterId, userId] = customId.split(":");

    logger.debug("Capability button clicked", {
      customId,
      capabilityId,
      characterId,
      userId,
      currentUserId: interaction.user.id,
    });

    try {
      // Vérifier que l'utilisateur qui clique est bien le propriétaire du profil
      if (interaction.user.id !== userId) {
        logger.debug("Owner verification failed", {
          expected: userId,
          actual: interaction.user.id,
        });
        await interaction.reply({
          content: `${STATUS.ERROR} Vous ne pouvez utiliser que vos propres capacités.`,
          flags: ["Ephemeral"],
        });
        return;
      }

      await interaction.deferReply({ flags: ["Ephemeral"] });

      // Récupérer les détails de la capacité
      const capabilities = await getCharacterCapabilities(characterId);
      const selectedCapability = capabilities.find(
        (cap) => cap.id === capabilityId
      );

      if (!selectedCapability) {
        await interaction.editReply(`${STATUS.ERROR} Capacité non trouvée.`);
        return;
      }

      // Récupérer le personnage pour vérifier les PA
      const characterService = new (
        await import("../../services/api/character-api.service")
      ).CharacterAPIService(httpClient);
      const character = await characterService.getCharacterById(characterId);

      if (!character) {
        await interaction.editReply(`${STATUS.ERROR} Personnage non trouvé.`);
        return;
      }

      // Vérifier que le personnage appartient à l'utilisateur
      if (!character.user || character.user.discordId !== userId) {
        logger.debug("Character owner verification failed", {
          characterUserId: character.userId,
          characterDiscordId: character.user?.discordId,
          expectedUserId: userId,
          actualUserId: interaction.user.id,
        });
        await interaction.editReply(
          `${STATUS.ERROR} Vous ne pouvez utiliser que vos propres capacités.`
        );
        return;
      }

      // Vérifier que le personnage n'est pas mort
      if (character.isDead) {
        await interaction.editReply(
          `${STATUS.ERROR} Vous ne pouvez pas utiliser de capacités avec un personnage mort.`
        );
        return;
      }

      // Vérifier les PA
      if (character.paTotal < selectedCapability.costPA) {
        await interaction.editReply(
          `${STATUS.ERROR} Vous n'avez pas assez de PA (${character.paTotal}/${selectedCapability.costPA} requis).`
        );
        return;
      }

      // Exécuter la capacité
      const seasonResponse = await httpClient.get("/seasons/current");
      const currentSeason = seasonResponse.data;
      const isSummer = currentSeason?.name?.toLowerCase() === "summer";

      const response = await httpClient.post(
        `/characters/${characterId}/capabilities/use`,
        {
          capabilityId: capabilityId,
          isSummer,
        }
      );

      const result = response.data;

      // Afficher le résultat
      if (result.publicMessage && interaction.guildId) {
        await sendLogMessage(
          interaction.guildId,
          interaction.client,
          result.publicMessage
        );
      }

      await interaction.editReply({
        content: `✅ **${selectedCapability.name}** utilisée avec succès !\n${result.message || ""
          }`,
      });
    } catch (error: any) {
      logger.error("Error using capability via button:", {
        error: formatErrorForLog(error),
        capabilityId,
        characterId,
        userId: interaction.user.id,
      });

      // Extraire le message d'erreur détaillé du backend pour les erreurs HTTP
      let errorMessage = "Une erreur est survenue";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      await interaction.editReply({
        content: `${STATUS.ERROR} ${errorMessage}`,
      });
    }
  }
}

function createCapabilitiesDisplay(
  capabilities:
    | Array<{
      name: string;
      description?: string;
      costPA: number;
      emojiTag?: string;
    }>
    | undefined
): string {
  if (!capabilities || capabilities.length === 0) {
    return "Aucune capacité connue";
  }

  // Obtenir l'emoji correspondant à l'emojiTag depuis l'objet CAPABILITIES
  const getEmojiForCapability = (emojiTag?: string): string => {
    console.log("getEmojiForCapability - emojiTag reçu:", emojiTag);
    if (!emojiTag) {
      console.log("Aucun emojiTag fourni, utilisation de CAPABILITIES.GENERIC");
      return CAPABILITIES.GENERIC;
    }

    const upperEmojiTag = emojiTag.toUpperCase();
    console.log("Recherche de la clé dans CAPABILITIES:", upperEmojiTag);

    // Vérifier si l'emojiTag existe comme clé dans CAPABILITIES
    const capabilityKey = Object.keys(CAPABILITIES).find(
      (key) => key === upperEmojiTag
    ) as keyof typeof CAPABILITIES | undefined;

    console.log("Clé trouvée dans CAPABILITIES:", capabilityKey);

    if (capabilityKey) {
      const emoji = CAPABILITIES[capabilityKey];
      console.log(`Emoji trouvé pour ${capabilityKey}:`, emoji);
      return emoji;
    }

    console.warn(`EmojiTag inconnu: ${emojiTag}`);
    console.log("CAPABILITIES disponibles:", Object.entries(CAPABILITIES));
    return CAPABILITIES.GENERIC;
  };

  return capabilities
    .map(
      (cap) =>
        `${getEmojiForCapability(cap.emojiTag)} **${cap.name}** (${cap.costPA
        } PA)${cap.description ? ` • ${cap.description}` : ""}`
    )
    .join("\n");
}

function createCapabilityButtons(
  capabilities: Array<{
    id: string;
    name: string;
    costPA: number;
    emojiTag?: string;
  }>,
  userId: string,
  characterId: string,
  currentPA: number
): ActionRowBuilder<ButtonBuilder>[] | null {
  if (!capabilities || capabilities.length === 0) {
    return null;
  }

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const maxButtonsPerRow = 5; // Limite par ligne (Discord : 5 max)
  const maxRows = 4; // Limiter à 4 lignes pour laisser de la place pour d'autres boutons

  // Diviser les capacités en groupes de 5
  for (
    let i = 0;
    i < capabilities.length && rows.length < maxRows;
    i += maxButtonsPerRow
  ) {
    const group = capabilities.slice(i, i + maxButtonsPerRow);
    const buttons = group.map((cap) => {
      // Déterminer l'emoji selon l'emojiTag de la capacité
      const getEmojiForCapability = (emojiTag?: string): string => {
        if (!emojiTag) return CAPABILITIES.GENERIC;
        return (
          CAPABILITIES[emojiTag as keyof typeof CAPABILITIES] ||
          CAPABILITIES.GENERIC
        );
      };

      // Vérifier si le personnage a assez de PA pour cette capacité
      const hasEnoughPA = currentPA >= cap.costPA;
      const buttonStyle = hasEnoughPA
        ? ButtonStyle.Primary
        : ButtonStyle.Secondary;

      const button = new ButtonBuilder()
        .setCustomId(`use_capability:${cap.id}:${characterId}:${userId}`)
        .setLabel(`${cap.name} (${cap.costPA}PA)`) // Label original sans padding
        .setStyle(buttonStyle)
        .setEmoji(getEmojiForCapability(cap.emojiTag));

      // Désactiver le bouton si pas assez de PA
      if (!hasEnoughPA) {
        button.setDisabled(true);
      }

      return button;
    });

    // Créer une nouvelle ligne avec les boutons
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons));
  }

  return rows.length > 0 ? rows : null;
}
