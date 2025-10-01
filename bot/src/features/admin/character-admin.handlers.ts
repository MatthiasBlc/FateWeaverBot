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

  // Vérifier si c'est une soumission de modale
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
