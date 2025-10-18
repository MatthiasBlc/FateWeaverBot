import {
  StringSelectMenuInteraction,
  ButtonInteraction,
} from "discord.js";
import { apiService } from "../../../services/api";
import { logger } from "../../../services/logger";
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from "../../../utils/embeds";
import type { Character } from "../character-admin.types";
import {
  CHARACTER_ADMIN_CUSTOM_IDS,
  createStatsModal,
  createAdvancedStatsModal,
  createCharacterDetailsContent,
  createCharacterActionButtons,
} from "../character-admin.components";

/**
 * Gère la sélection d'un personnage dans le menu déroulant.
 */
export async function handleCharacterSelect(
  interaction: StringSelectMenuInteraction
) {
  const characterId = interaction.values[0];
  const characters = await getCharactersFromState(interaction);
  const character = characters.find((c) => c.id === characterId);

  if (!character) {
    await interaction.reply({
      content: "❌ Personnage non trouvé.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const content = createCharacterDetailsContent(character);
  const buttonRows = createCharacterActionButtons(character);

  await interaction.reply({
    content,
    components: buttonRows,
    flags: ["Ephemeral"],
  });
}

/**
 * Gère les clics sur les boutons d'action des personnages.
 */
export async function handleCharacterAction(interaction: ButtonInteraction) {
  const id = interaction.customId;

  let characterId: string | null = null;
  let action: "stats" | "advanced" | "kill" | "reroll" | null = null;

  if (id.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.STATS_BUTTON_PREFIX)) {
    action = "stats";
    characterId = id.replace(
      CHARACTER_ADMIN_CUSTOM_IDS.STATS_BUTTON_PREFIX,
      ""
    );
  } else if (
    id.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_BUTTON_PREFIX)
  ) {
    action = "advanced";
    characterId = id.replace(
      CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_BUTTON_PREFIX,
      ""
    );
  } else if (id.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.KILL_BUTTON_PREFIX)) {
    action = "kill";
    characterId = id.replace(CHARACTER_ADMIN_CUSTOM_IDS.KILL_BUTTON_PREFIX, "");
  } else if (
    id.startsWith(CHARACTER_ADMIN_CUSTOM_IDS.TOGGLE_REROLL_BUTTON_PREFIX)
  ) {
    action = "reroll";
    characterId = id.replace(
      CHARACTER_ADMIN_CUSTOM_IDS.TOGGLE_REROLL_BUTTON_PREFIX,
      ""
    );
  }

  if (!action || !characterId) {
    await interaction.reply({
      content: "❌ Action inconnue.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const characters = await getCharactersFromState(interaction);
  const character = characters.find((c) => c.id === characterId);

  if (!character) {
    await interaction.reply({
      content: "❌ Personnage non trouvé.",
      flags: ["Ephemeral"],
    });
    return;
  }

  switch (action) {
    case "stats":
      await handleStatsButton(interaction, character);
      break;
    case "advanced":
      await handleAdvancedStatsButton(interaction, character);
      break;
    case "kill":
      await handleKillButton(interaction, character);
      break;
    case "reroll":
      await handleToggleRerollButton(interaction, character);
      break;
  }
}

// --- Private Helper Functions --- //

/**
 * Récupère les personnages depuis l'état de l'interaction (temporaire).
 * TODO: Remplacer par un système de cache ou de stockage plus robuste.
 */
async function getCharactersFromState(interaction: any): Promise<Character[]> {
  // Pour l'instant, on récupère à nouveau depuis l'API
  // Dans une version future, on pourrait utiliser un cache Redis ou autre
  const guildId = interaction.guildId;
  if (!guildId) return [];

  const town = await apiService.guilds.getTownByGuildId(guildId);
  if (
    !town ||
    typeof town !== "object" ||
    !("id" in town) ||
    typeof town.id !== "string"
  )
    return [];

  return (await apiService.characters.getTownCharacters(town.id)) as Character[];
}

/**
 * Gestionnaire pour le bouton "Modifier Stats".
 */
async function handleStatsButton(
  interaction: ButtonInteraction,
  character: Character
) {
  if (character.isDead) {
    await interaction.reply({
      content:
        "❌ Impossible de modifier les statistiques d'un personnage mort.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const modal = createStatsModal(character);
  await interaction.showModal(modal);
}

/**
 * Gestionnaire pour le bouton "Stats Avancées".
 */
async function handleAdvancedStatsButton(
  interaction: ButtonInteraction,
  character: Character
) {
  const modal = createAdvancedStatsModal(character);
  await interaction.showModal(modal);
}

/**
 * Gestionnaire pour le bouton "Tuer Personnage".
 */
async function handleKillButton(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    if (character.isDead) {
      await interaction.reply({
        content: "❌ Ce personnage est déjà mort.",
        flags: ["Ephemeral"],
      });
      return;
    }

    await apiService.characters.killCharacter(character.id);

    const embed = createErrorEmbed(
      "💀 Personnage Tué",
      `**${character.name}** a été tué.`
    );

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });

    // Log de l'action
    try {
      const { sendLogMessage } = await import("../../../utils/channels");
      const logMessage = `💀 **Mort d'un personnage**\nLe personnage **${
        character.name
      }**, <@${
        character.user?.discordId || "Inconnu"
      }> est mort.\n*${new Date().toLocaleString()}*`;
      await sendLogMessage(
        interaction.guildId!,
        interaction.client,
        logMessage
      );
    } catch (logError) {
      logger.error("Erreur lors de l'envoi du log:", { logError });
    }
  } catch (error) {
    logger.error("Erreur lors de la suppression du personnage:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
      return; // Interaction expirée
    }
    await interaction.reply({
      content: "❌ Erreur lors de la gestion du reroll.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gestionnaire pour le bouton "Gérer Capacités".
 */
async function handleToggleRerollButton(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    const newCanReroll = !character.canReroll;
    await apiService.characters.updateCharacterStats(character.id, {
      canReroll: newCanReroll,
    });

    const embed = createSuccessEmbed(
      `Autorisation de Reroll ${newCanReroll ? "Accordée" : "Révoquée"}`,
      `**${character.name}** ${newCanReroll ? "peut maintenant" : "ne peut plus"} créer un nouveau personnage.`
    );

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la gestion du reroll:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
      return; // Interaction expirée
    }
    await interaction.reply({
      content: "❌ Erreur lors de la gestion du reroll.",
      flags: ["Ephemeral"],
    });
  }
}
