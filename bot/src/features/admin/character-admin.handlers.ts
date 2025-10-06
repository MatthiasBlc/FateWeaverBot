import { type ChatInputCommandInteraction } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
import type { Character, Town } from "./character-admin.types";
import {
  createCharacterSelectMenu,
  CHARACTER_ADMIN_CUSTOM_IDS,
} from "./character-admin.components";

/**
 * Récupère un personnage par son ID depuis la ville du serveur.
 */
async function getCharacterById(characterId: string, interaction: any): Promise<Character> {
  // Récupérer la ville du serveur depuis l'interaction
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new Error("GuildId non trouvé dans l'interaction");
  }

  const town = (await apiService.getTownByGuildId(guildId)) as Town | null;
  if (!town || !town.id) {
    throw new Error("Ville non trouvée pour ce serveur");
  }

  // Récupérer tous les personnages de la ville
  const characters = (await apiService.getTownCharacters(town.id)) as Character[];
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
          "❌ Vous devez être administrateur pour utiliser cette commande.",
        flags: ["Ephemeral"],
      });
      return;
    }

    logger.info("Utilisateur vérifié comme admin", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Récupérer la ville du serveur
    const town = (await apiService.getTownByGuildId(
      interaction.guildId!
    )) as Town | null;

    if (!town || !town.id) {
      logger.warn("Aucune ville trouvée pour le serveur", {
        guildId: interaction.guildId,
      });
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer tous les personnages de la ville
    const characters = (await apiService.getTownCharacters(
      town.id
    )) as Character[];

    if (!characters || characters.length === 0) {
      await interaction.reply({
        content: "❌ Aucun personnage trouvé dans cette ville.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le menu de sélection des personnages
    const selectMenu = createCharacterSelectMenu(characters);

    await interaction.reply({
      content:
        "👤 **Administration des Personnages**\nSélectionnez un personnage à gérer :",
      components: [selectMenu],
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
        "❌ Une erreur est survenue lors de la préparation de la commande.",
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

  // Route vers les gestionnaires appropriés selon le type d'interaction
  if (customId === CHARACTER_ADMIN_CUSTOM_IDS.SELECT_MENU) {
    const { handleCharacterSelect } = await import(
      "./character-admin.interactions"
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
      "./character-admin.interactions"
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
      "./character-admin.interactions"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleCapabilitiesButton(interaction, character);
  }

  // Vérifier si c'est un bouton d'ajout de capacités
  if (customId.startsWith("capability_admin_add:")) {
    const characterId = customId.replace("capability_admin_add:", '');
    const { handleAddCapabilities } = await import(
      "./character-admin.interactions"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleAddCapabilities(interaction, character);
  }

  // Vérifier si c'est un bouton de suppression de capacités
  if (customId.startsWith("capability_admin_remove:")) {
    const characterId = customId.replace("capability_admin_remove:", '');
    const { handleRemoveCapabilities } = await import(
      "./character-admin.interactions"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleRemoveCapabilities(interaction, character);
  }

  // Vérifier si c'est un bouton d'affichage de capacités
  if (customId.startsWith("capability_admin_view:")) {
    const characterId = customId.replace("capability_admin_view:", '');
    const { handleViewCapabilities } = await import(
      "./character-admin.interactions"
    );
    const character = await getCharacterById(characterId, interaction);
    return handleViewCapabilities(interaction, character);
  }

  // Vérifier si c'est une sélection de capacités
  if (customId.startsWith("capability_admin_select")) {
    const { handleCapabilitySelect } = await import(
      "./character-admin.interactions"
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
        content: "❌ Impossible de déterminer le personnage cible.",
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

  // Vérifier si c'est une soumission de modale pour les statistiques
  if (
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.STATS_MODAL_PREFIX) ||
    customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_MODAL_PREFIX)
  ) {
    const { handleStatsModalSubmit, handleAdvancedStatsModalSubmit } =
      await import("./character-admin.interactions");

    if (customId.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.STATS_MODAL_PREFIX)) {
      return handleStatsModalSubmit(interaction);
    } else {
      return handleAdvancedStatsModalSubmit(interaction);
    }
  }

  // Interaction non reconnue
  logger.warn("Interaction d'administration de personnage non reconnue", {
    customId,
    userId: interaction.user.id,
  });
}
