import {
  type StringSelectMenuInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { getHungerLevelText } from "../../utils/hunger";
import type { Character } from "./character-admin.types";
import {
  CHARACTER_ADMIN_CUSTOM_IDS,
  createStatsModal,
  createAdvancedStatsModal,
  createCharacterDetailsContent,
  createCharacterActionButtons,
} from "./character-admin.components";

// --- Interaction Handlers --- //

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
  const buttons = createCharacterActionButtons(character);

  await interaction.reply({
    content,
    components: [buttons],
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

/**
 * Gère les soumissions de modales pour les statistiques de base.
 */
export async function handleStatsModalSubmit(
  interaction: ModalSubmitInteraction
) {
  const characterId = interaction.customId.replace(
    CHARACTER_ADMIN_CUSTOM_IDS.STATS_MODAL_PREFIX,
    ""
  );

  // Note: On ne vérifie plus si le personnage est mort car le backend gère automatiquement
  // la mort quand PV ou faim tombent à 0. Cette vérification était faite avant l'appel API
  // mais maintenant le backend peut changer l'état du personnage pendant la mise à jour.

  const paValue = interaction.fields.getTextInputValue("pa_input");
  const hungerValue = interaction.fields.getTextInputValue("hunger_input");
  const hpValue = interaction.fields.getTextInputValue("hp_input");

  const paNumber = parseInt(paValue, 10);
  const hungerNumber = parseInt(hungerValue, 10);
  const hpNumber = parseInt(hpValue, 10);

  // Validation
  const errors = [];
  if (isNaN(paNumber) || paNumber < 0 || paNumber > 4) {
    errors.push("Les PA doivent être un nombre entre 0 et 4");
  }
  if (isNaN(hungerNumber) || hungerNumber < 0 || hungerNumber > 4) {
    errors.push("Le niveau de faim doit être un nombre entre 0 et 4");
  }
  if (isNaN(hpNumber) || hpNumber < 0 || hpNumber > 5) {
    errors.push("Les PV doivent être un nombre entre 0 et 5");
  }

  if (errors.length > 0) {
    await interaction.reply({
      content: `❌ ${errors.join(", ")}`,
      flags: ["Ephemeral"],
    });
    return;
  }

  try {
    const updatedCharacter = (await apiService.updateCharacterStats(
      characterId,
      {
        paTotal: paNumber,
        hungerLevel: hungerNumber,
        hp: hpNumber,
      }
    )) as Character;

    // Créer l'embed avec la couleur appropriée selon l'état du personnage
    const embedColor = updatedCharacter.isDead ? 0xff0000 : 0x00ff00;
    const embedTitle = updatedCharacter.isDead
      ? "💀 Personnage décédé"
      : "✅ Stats mises à jour";
    const embedDescription = updatedCharacter.isDead
      ? `**${updatedCharacter.name}** est mort${
          hpNumber <= 0 ? " (PV à 0)" : " (faim à 0)"
        }.`
      : `**${updatedCharacter.name}** a été modifié.`;

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(embedTitle)
      .setDescription(embedDescription)
      .addFields(
        {
          name: "Points d'Actions",
          value: `${updatedCharacter.paTotal}`,
          inline: true,
        },
        {
          name: "Niveau de faim",
          value: getHungerLevelText(updatedCharacter.hungerLevel),
          inline: true,
        },
        {
          name: "Points de vie",
          value: `${updatedCharacter.hp}`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });

    // Log de la mort si le personnage vient de mourir
    if (updatedCharacter.isDead) {
      try {
        const { sendLogMessage } = await import("../../utils/channels");
        const deathReason = hpNumber <= 0 ? "PV à 0" : "faim à 0";
        const logMessage = `💀 **Mort d'un personnage **\nLe personnage **${
          updatedCharacter.name
        }**, <@${
          updatedCharacter.user?.discordId || "Inconnu"
        }> est mort (${deathReason}).\n*${new Date().toLocaleString()}*`;
        await sendLogMessage(
          interaction.guildId!,
          interaction.client,
          logMessage
        );
      } catch (logError) {
        logger.error("Erreur lors de l'envoi du log de mort:", { logError });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la mise à jour des stats:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de la mise à jour des statistiques.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère les soumissions de modales pour les statistiques avancées.
 */
export async function handleAdvancedStatsModalSubmit(
  interaction: ModalSubmitInteraction
) {
  const characterId = interaction.customId.replace(
    CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_MODAL_PREFIX,
    ""
  );

  const isDeadValue = interaction.fields.getTextInputValue("is_dead_input");
  const isActiveValue = interaction.fields.getTextInputValue("is_active_input");
  const canRerollValue =
    interaction.fields.getTextInputValue("can_reroll_input");

  // Validation
  if (!["true", "false"].includes(isDeadValue)) {
    await interaction.reply({
      content: "❌ 'Mort' doit être 'true' ou 'false'.",
      flags: ["Ephemeral"],
    });
    return;
  }
  if (!["true", "false"].includes(isActiveValue)) {
    await interaction.reply({
      content: "❌ 'Actif' doit être 'true' ou 'false'.",
      flags: ["Ephemeral"],
    });
    return;
  }
  if (!["true", "false"].includes(canRerollValue)) {
    await interaction.reply({
      content: "❌ 'Reroll autorisé' doit être 'true' ou 'false'.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const updateData = {
    isDead: isDeadValue === "true",
    isActive: isActiveValue === "true",
    canReroll: canRerollValue === "true",
  };

  try {
    const updatedCharacter = (await apiService.updateCharacterStats(
      characterId,
      updateData
    )) as Character;

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Stats avancées mises à jour")
      .setDescription(`**${updatedCharacter.name}** a été modifié.`)
      .addFields(
        {
          name: "Mort",
          value: updatedCharacter.isDead ? "💀 Oui" : "❤️ Non",
          inline: true,
        },
        {
          name: "Actif",
          value: updatedCharacter.isActive ? "✅ Oui" : "❌ Non",
          inline: true,
        },
        {
          name: "Reroll",
          value: updatedCharacter.canReroll ? "✅ Oui" : "❌ Non",
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la mise à jour des stats avancées:", {
      error,
    });
    await interaction.reply({
      content: "❌ Erreur lors de la mise à jour des statistiques avancées.",
      flags: ["Ephemeral"],
    });
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

  const town = await apiService.getTownByGuildId(guildId);
  if (
    !town ||
    typeof town !== "object" ||
    !("id" in town) ||
    typeof town.id !== "string"
  )
    return [];

  return (await apiService.getTownCharacters(town.id)) as Character[];
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

    await apiService.killCharacter(character.id);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("💀 Personnage Tué")
      .setDescription(`**${character.name}** a été tué.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });

    // Log de l'action
    try {
      const { sendLogMessage } = await import("../../utils/channels");
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
      content: "❌ Erreur lors de la suppression du personnage.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gestionnaire pour le bouton "Toggle Reroll".
 */
async function handleToggleRerollButton(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    const newCanReroll = !character.canReroll;
    await apiService.updateCharacterStats(character.id, {
      canReroll: newCanReroll,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(
        `🔄 Autorisation de Reroll ${newCanReroll ? "Accordée" : "Révoquée"}`
      )
      .setDescription(
        `**${character.name}** ${
          newCanReroll ? "peut maintenant" : "ne peut plus"
        } créer un nouveau personnage.`
      )
      .setTimestamp();

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
