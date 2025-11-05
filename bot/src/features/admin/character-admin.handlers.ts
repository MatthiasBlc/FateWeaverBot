/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ChatInputCommandInteraction } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
import type { Character, Town } from "./character-admin.types";
import {
  createCharacterSelectMenu,
  createMassModificationButtons,
  CHARACTER_ADMIN_CUSTOM_IDS,
} from "./character-admin.components";
import { STATUS } from "../../constants/emojis.js";


/**
 * Récupère un personnage par son ID depuis la ville du serveur.
 */
async function getCharacterById(characterId: string, interaction: any): Promise<Character> {
  // Récupérer la ville du serveur depuis l'interaction
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new Error("GuildId non trouvé dans l'interaction");
  }

  const town = (await apiService.guilds.getTownByGuildId(guildId)) as Town | null;
  if (!town || !town.id) {
    throw new Error("Ville non trouvée pour ce serveur");
  }

  // Récupérer tous les personnages de la ville
  const characters = (await apiService.characters.getTownCharacters(town.id)) as Character[];
  const character = characters.find(c => c.id === characterId);

  if (!character) {
    throw new Error(`Personnage ${characterId} non trouvé`);
  }

  return character;
}

/**
 * Extrait le characterId depuis les composants du message (boutons).
 */
function extractCharacterIdFromMessage(message: any): string | null {
  if (!message.components) return null;

  for (const actionRow of message.components) {
    if (actionRow.components) {
      for (const component of actionRow.components) {
        if (component.customId && component.customId.includes(':')) {
          // Les customIds sont au format "prefix:characterId" ou "capability_admin_xxx:characterId"
          const parts = component.customId.split(':');
          if (parts.length >= 2) {
            return parts[1]; // Retourner la deuxième partie comme characterId
          }
        }
      }
    }
  }

  return null;
}

/**
 * Commande principale pour l'administration des personnages.
 * Affiche un menu de sélection des personnages disponibles.
 */
export async function handleCharacterAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    logger.info("Début de handleCharacterAdminCommand", {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn(
        "Utilisateur non admin tente d'utiliser la commande character-admin",
        {
          userId: interaction.user.id,
          guildId: interaction.guildId,
        }
      );
      await interaction.reply({
        content:
          `${STATUS.ERROR} Vous devez être administrateur pour utiliser cette commande.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    logger.info("Utilisateur vérifié comme admin", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Récupérer la ville du serveur
    const town = (await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    )) as Town | null;

    if (!town || !town.id) {
      logger.warn("Aucune ville trouvée pour le serveur", {
        guildId: interaction.guildId,
      });
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer tous les personnages de la ville
    const characters = (await apiService.characters.getTownCharacters(
      town.id
    )) as Character[];

    if (!characters || characters.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucun personnage trouvé dans cette ville.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le menu de sélection des personnages
    const selectMenu = createCharacterSelectMenu(characters);

    // Créer les boutons de modification de masse (retourne 2 ActionRows)
    const massModButtons = createMassModificationButtons();

    await interaction.reply({
      content:
        "👤 **Administration des Personnages**\nSélectionnez un personnage à gérer ou utilisez les modifications de masse :",
      components: [selectMenu, ...massModButtons],
      flags: ["Ephemeral"],
    });

    logger.info("Menu d'administration des personnages affiché", {
      guildId: interaction.guildId,
      characterCount: characters.length,
    });
  } catch (error) {
    logger.error(
      "Erreur lors de la préparation de la commande character-admin:",
      {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      }
    );
    await interaction.reply({
      content:
        `${STATUS.ERROR} Une erreur est survenue lors de la préparation de la commande.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère toutes les interactions liées à l'administration des personnages.
 * Cette fonction est appelée par le gestionnaire d'interactions principal.
 */
export async function handleCharacterAdminInteraction(interaction: any) {
  const { customId } = interaction;

  // CRITIQUE: Defer immédiatement pour éviter l'expiration de l'interaction (3 secondes)
  // Cela nous donne 15 minutes pour répondre au lieu de 3 secondes
  // EXCEPTION: Ne pas defer les boutons qui ouvrent des modales (stats, advanced stats)
  // car showModal() ne fonctionne pas après un defer
  try {
    if (!interaction.replied && !interaction.deferred) {
      // Ne pas defer les boutons qui ouvrent des modales
      const isModalButton =
        customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.STATS_BUTTON_PREFIX) ||
        customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_BUTTON_PREFIX) ||
        customId.startsWith("mass_stats_add:") ||
        customId.startsWith("mass_stats_remove:");

      // Ne pas defer les boutons qui créent une nouvelle réponse éphémère (ils font leur propre deferReply)
      const isReplyButton =
        customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.CAPABILITIES_BUTTON_PREFIX) ||
        customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.OBJECTS_BUTTON_PREFIX) ||
        customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.SKILLS_BUTTON_PREFIX) ||
        customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PV_BUTTON ||
        customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PM_BUTTON ||
        customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_FAIM_BUTTON ||
        customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PA_BUTTON ||
        customId.startsWith("capability_admin_add:") ||
        customId.startsWith("capability_admin_remove:") ||
        customId.startsWith("capability_admin_view:") ||
        customId.startsWith("object_admin_add:") ||
        customId.startsWith("object_admin_remove:") ||
        customId.startsWith("object_category_add:") ||
        customId.startsWith("object_category_remove:") ||
        customId.startsWith("skill_admin_add:") ||
        customId.startsWith("skill_admin_remove:") ||
        customId.startsWith("skill_category_add:") ||
        customId.startsWith("skill_category_remove:");

      if (interaction.isButton() && !isModalButton && !isReplyButton) {
        await interaction.deferUpdate();
      } else if (interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
        await interaction.deferReply({ ephemeral: true });
      }
      // Les boutons modaux et les boutons reply ne sont pas defer et gèrent eux-mêmes leur defer
    }
  } catch (error) {
    logger.error("Erreur lors du defer de l'interaction (interaction probablement expirée)", { error, customId });
    // Si le defer échoue, l'interaction est déjà expirée - on ne peut plus rien faire
    return;
  }

  // Route vers les gestionnaires appropriés selon le type d'interaction
  if (customId === CHARACTER_ADMIN_CUSTOM_IDS.SELECT_MENU) {
    const { handleCharacterSelect } = await import(
      "./character-admin/character-select"
    );
    return handleCharacterSelect(interaction);
  }

  // Vérifier si c'est un bouton d'action sur un personnage
  if (
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.STATS_BUTTON_PREFIX) ||
    customId.startsWith(
      CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_BUTTON_PREFIX
    ) ||
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.KILL_BUTTON_PREFIX) ||
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.TOGGLE_REROLL_BUTTON_PREFIX)
  ) {
    const { handleCharacterAction } = await import(
      "./character-admin/character-select"
    );
    return handleCharacterAction(interaction);
  }

  // Vérifier si c'est un bouton de gestion des capacités
  if (
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.CAPABILITIES_BUTTON_PREFIX)
  ) {
    // Récupérer le personnage depuis le customId
    const characterId = customId.replace(CHARACTER_ADMIN_CUSTOM_IDS.CAPABILITIES_BUTTON_PREFIX, '');
    const { handleCapabilitiesButton } = await import(
      "./character-admin/character-capabilities"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleCapabilitiesButton(interaction, character);
  }

  // Vérifier si c'est un bouton de gestion des objets
  if (
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.OBJECTS_BUTTON_PREFIX)
  ) {
    const characterId = customId.replace(CHARACTER_ADMIN_CUSTOM_IDS.OBJECTS_BUTTON_PREFIX, '');
    const { handleObjectsButton } = await import(
      "./character-admin/character-objects"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleObjectsButton(interaction, character);
  }

  // Vérifier si c'est un bouton de gestion des compétences
  if (
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.SKILLS_BUTTON_PREFIX)
  ) {
    const characterId = customId.replace(CHARACTER_ADMIN_CUSTOM_IDS.SKILLS_BUTTON_PREFIX, '');
    const { handleSkillsButton } = await import(
      "./character-admin/character-skills"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleSkillsButton(interaction, character);
  }

  // Vérifier si c'est un bouton d'ajout de capacités
  if (customId.startsWith("capability_admin_add:")) {
    const characterId = customId.replace("capability_admin_add:", '');
    const { handleAddCapabilities } = await import(
      "./character-admin/character-capabilities"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleAddCapabilities(interaction, character);
  }

  // Vérifier si c'est un bouton de suppression de capacités
  if (customId.startsWith("capability_admin_remove:")) {
    const characterId = customId.replace("capability_admin_remove:", '');
    const { handleRemoveCapabilities } = await import(
      "./character-admin/character-capabilities"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleRemoveCapabilities(interaction, character);
  }

  // Vérifier si c'est un bouton d'affichage de capacités
  if (customId.startsWith("capability_admin_view:")) {
    const characterId = customId.replace("capability_admin_view:", '');
    const { handleViewCapabilities } = await import(
      "./character-admin/character-capabilities"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleViewCapabilities(interaction, character);
  }

  // Vérifier si c'est une sélection de capacités
  if (customId.startsWith("capability_admin_select")) {
    const { handleCapabilitySelect } = await import(
      "./character-admin/character-capabilities"
    );

    // Extraire l'ID du personnage depuis le customId (format: capability_admin_select:characterId)
    let characterId = null;
    if (customId.includes(':')) {
      characterId = customId.split(':')[1];
    }

    // Si on n'a pas trouvé l'ID dans le customId, essayer de le récupérer depuis le message
    if (!characterId) {
      characterId = extractCharacterIdFromMessage(interaction.message);

      // Si toujours pas trouvé, essayer depuis l'interaction du message
      if (!characterId && interaction.message.interaction) {
        const buttonId = interaction.message.interaction.customId;
        if (buttonId) {
          if (buttonId.startsWith('capability_admin_add:')) {
            characterId = buttonId.replace('capability_admin_add:', '');
          } else if (buttonId.startsWith('capability_admin_remove:')) {
            characterId = buttonId.replace('capability_admin_remove:', '');
          }
        }
      }
    }

    if (!characterId) {
      return interaction.reply({
        content: `${STATUS.ERROR} Impossible de déterminer le personnage cible.`,
        flags: ["Ephemeral"],
      });
    }

    // Déterminer si c'est une action d'ajout ou de suppression
    let action: 'add' | 'remove';
    const messageContent = interaction.message.content || '';

    if (messageContent.includes("Ajouter") || messageContent.includes("ajouter")) {
      action = 'add';
    } else if (messageContent.includes("Retirer") || messageContent.includes("retirer")) {
      action = 'remove';
    } else {
      // Par défaut, on considère que c'est un ajout
      action = 'add';
    }

    const character = await getCharacterById(characterId, interaction);
    return handleCapabilitySelect(interaction, character, action);
  }

  // Vérifier si c'est un bouton d'ajout d'objets
  if (customId.startsWith("object_admin_add:")) {
    const characterId = customId.replace("object_admin_add:", '');
    const { handleAddObjects } = await import(
      "./character-admin/character-objects"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleAddObjects(interaction, character);
  }

  // Vérifier si c'est un bouton de suppression d'objets
  if (customId.startsWith("object_admin_remove:")) {
    const characterId = customId.replace("object_admin_remove:", '');
    const { handleRemoveObjects } = await import(
      "./character-admin/character-objects"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleRemoveObjects(interaction, character);
  }

  // Vérifier si c'est un bouton de catégorie d'objets
  if (customId.startsWith("object_category_add:") || customId.startsWith("object_category_remove:")) {
    const { handleObjectCategory } = await import(
      "./character-admin/character-objects"
    );

    // Format: object_category_add:characterId:category:page
    const parts = customId.split(':');
    const action = customId.startsWith("object_category_add:") ? 'add' : 'remove';
    const characterId = parts[1];
    const category = parts[2] as 'simple' | 'capacity' | 'skill' | 'resource';
    const page = parseInt(parts[3], 10);

    const character = await getCharacterById(characterId, interaction);
    return handleObjectCategory(interaction, character, category, page, action);
  }

  // Vérifier si c'est une sélection d'objets
  if (customId.startsWith("object_admin_select")) {
    const { handleObjectSelect } = await import(
      "./character-admin/character-objects"
    );

    let characterId = null;
    if (customId.includes(':')) {
      characterId = customId.split(':')[1];
    }

    if (!characterId) {
      characterId = extractCharacterIdFromMessage(interaction.message);

      if (!characterId && interaction.message.interaction) {
        const buttonId = interaction.message.interaction.customId;
        if (buttonId) {
          if (buttonId.startsWith('object_admin_add:')) {
            characterId = buttonId.replace('object_admin_add:', '');
          } else if (buttonId.startsWith('object_admin_remove:')) {
            characterId = buttonId.replace('object_admin_remove:', '');
          }
        }
      }
    }

    if (!characterId) {
      return interaction.reply({
        content: `${STATUS.ERROR} Impossible de déterminer le personnage cible.`,
        flags: ["Ephemeral"],
      });
    }

    let action: 'add' | 'remove';
    const messageContent = interaction.message.content || '';

    if (messageContent.includes("Ajouter") || messageContent.includes("ajouter")) {
      action = 'add';
    } else if (messageContent.includes("Retirer") || messageContent.includes("retirer")) {
      action = 'remove';
    } else {
      action = 'add';
    }

    const character = await getCharacterById(characterId, interaction);
    return handleObjectSelect(interaction, character, action);
  }

  // Vérifier si c'est un bouton d'ajout de compétences
  if (customId.startsWith("skill_admin_add:")) {
    const characterId = customId.replace("skill_admin_add:", '');
    const { handleAddSkills } = await import(
      "./character-admin/character-skills"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleAddSkills(interaction, character);
  }

  // Vérifier si c'est un bouton de suppression de compétences
  if (customId.startsWith("skill_admin_remove:")) {
    const characterId = customId.replace("skill_admin_remove:", '');
    const { handleRemoveSkills } = await import(
      "./character-admin/character-skills"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleRemoveSkills(interaction, character);
  }

  // Vérifier si c'est un bouton de catégorie de compétences
  if (customId.startsWith("skill_category_add:") || customId.startsWith("skill_category_remove:")) {
    const { handleSkillCategory } = await import(
      "./character-admin/character-skills"
    );

    // Format: skill_category_add:characterId:category:page
    const parts = customId.split(':');
    const action = customId.startsWith("skill_category_add:") ? 'add' : 'remove';
    const characterId = parts[1];
    const category = parts[2] as 'movement' | 'combat' | 'nature' | 'perception';
    const page = parseInt(parts[3], 10);

    const character = await getCharacterById(characterId, interaction);
    return handleSkillCategory(interaction, character, category, page, action);
  }

  // Vérifier si c'est une sélection de compétences
  if (customId.startsWith("skill_admin_select")) {
    const { handleSkillSelect } = await import(
      "./character-admin/character-skills"
    );

    let characterId = null;
    if (customId.includes(':')) {
      characterId = customId.split(':')[1];
    }

    if (!characterId) {
      characterId = extractCharacterIdFromMessage(interaction.message);

      if (!characterId && interaction.message.interaction) {
        const buttonId = interaction.message.interaction.customId;
        if (buttonId) {
          if (buttonId.startsWith('skill_admin_add:')) {
            characterId = buttonId.replace('skill_admin_add:', '');
          } else if (buttonId.startsWith('skill_admin_remove:')) {
            characterId = buttonId.replace('skill_admin_remove:', '');
          }
        }
      }
    }

    if (!characterId) {
      return interaction.reply({
        content: `${STATUS.ERROR} Impossible de déterminer le personnage cible.`,
        flags: ["Ephemeral"],
      });
    }

    let action: 'add' | 'remove';
    const messageContent = interaction.message.content || '';

    if (messageContent.includes("Ajouter") || messageContent.includes("ajouter")) {
      action = 'add';
    } else if (messageContent.includes("Retirer") || messageContent.includes("retirer")) {
      action = 'remove';
    } else {
      action = 'add';
    }

    const character = await getCharacterById(characterId, interaction);
    return handleSkillSelect(interaction, character, action);
  }

  // Vérifier si c'est une soumission de modale pour les statistiques
  if (
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.STATS_MODAL_PREFIX) ||
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_MODAL_PREFIX)
  ) {
    const { handleStatsModalSubmit, handleAdvancedStatsModalSubmit } =
      await import("./character-admin/character-stats");

    if (customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.STATS_MODAL_PREFIX)) {
      return handleStatsModalSubmit(interaction);
    } else {
      return handleAdvancedStatsModalSubmit(interaction);
    }
  }

  // Vérifier si c'est un bouton de modification de masse (PV, PM, FAIM, PA)
  if (
    customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PV_BUTTON ||
    customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PM_BUTTON ||
    customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_FAIM_BUTTON ||
    customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PA_BUTTON
  ) {
    const {
      handleMassPVButton,
      handleMassPMButton,
      handleMassFaimButton,
      handleMassPAButton,
    } = await import("./character-admin/character-mass-stats");

    if (customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PV_BUTTON) {
      return handleMassPVButton(interaction);
    } else if (customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_PM_BUTTON) {
      return handleMassPMButton(interaction);
    } else if (customId === CHARACTER_ADMIN_CUSTOM_IDS.MASS_FAIM_BUTTON) {
      return handleMassFaimButton(interaction);
    } else {
      return handleMassPAButton(interaction);
    }
  }

  // Vérifier si c'est une sélection de personnages pour modification de masse
  if (customId.startsWith("mass_stats_select:")) {
    const { handleMassStatsSelect } = await import(
      "./character-admin/character-mass-stats"
    );
    return handleMassStatsSelect(interaction);
  }

  // Vérifier si c'est un bouton d'action (Ajouter/Retirer) pour modification de masse
  if (
    customId.startsWith("mass_stats_add:") ||
    customId.startsWith("mass_stats_remove:")
  ) {
    const { handleMassStatsAction } = await import(
      "./character-admin/character-mass-stats"
    );
    return handleMassStatsAction(interaction);
  }

  // Vérifier si c'est une soumission de modale pour modification de masse
  if (customId.startsWith("mass_stats_modal:")) {
    const { handleMassStatsModalSubmit } = await import(
      "./character-admin/character-mass-stats"
    );
    return handleMassStatsModalSubmit(interaction);
  }

  // Vérifier si c'est une confirmation de modification de masse (bouton Confirmer)
  if (customId.startsWith("mass_stats_confirm_yes:")) {
    const { handleMassStatsConfirmation } = await import(
      "./character-admin/character-mass-stats"
    );
    return handleMassStatsConfirmation(interaction);
  }

  // Vérifier si c'est une annulation de modification de masse (bouton Annuler)
  if (customId === "mass_stats_confirm_no") {
    await interaction.update({
      content: `${STATUS.ERROR} Modification annulée.`,
      components: [],
    });
    return;
  }

  // Interaction non reconnue
  logger.warn("Interaction d'administration de personnage non reconnue", {
    customId,
    userId: interaction.user.id,
  });
}
