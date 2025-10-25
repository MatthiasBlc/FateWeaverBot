import {
  ModalSubmitInteraction,
  type GuildMember,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromModal } from "../../../utils/character";
import { createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import type { Character } from "../character-admin.types";
import {
  CHARACTER_ADMIN_CUSTOM_IDS,
} from "../character-admin.components";

/**
 * Get hunger level text - MATCHES /profil implementation
 * Uses same scale as /profil command for consistency
 */
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
      return "Satiété";
    default:
      return "Inconnu";
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
  const pmValue = interaction.fields.getTextInputValue("pm_input");

  const paNumber = parseInt(paValue, 10);
  const hungerNumber = parseInt(hungerValue, 10);
  const hpNumber = parseInt(hpValue, 10);
  const pmNumber = parseInt(pmValue, 10);

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
  if (isNaN(pmNumber) || pmNumber < 0 || pmNumber > 5) {
    errors.push("Les PM doivent être un nombre entre 0 et 5");
  }

  if (errors.length > 0) {
    await interaction.reply({
      content: `❌ ${errors.join(", ")}`,
      flags: ["Ephemeral"],
    });
    return;
  }

  try {
    const updatedCharacter = (await apiService.characters.updateCharacterStats(
      characterId,
      {
        paTotal: paNumber,
        hungerLevel: hungerNumber,
        hp: hpNumber,
        pm: pmNumber,
      }
    )) as Character;

    // Créer l'embed avec les utilitaires centralisés
    const deathReason =
      (hpNumber <= 0 ? "PV à 0" : "") +
      (pmNumber <= 0 ? (hpNumber <= 0 ? ", " : "") + "PM à 0" : "") +
      (hungerNumber <= 0
        ? (hpNumber <= 0 || pmNumber <= 0 ? ", " : "") + "faim à 0"
        : "");

    const embed = updatedCharacter.isDead
      ? createErrorEmbed(
          `💀 Personnage décédé`,
          `**${updatedCharacter.name}** est mort (${deathReason}).`
        )
      : createSuccessEmbed(
          "Stats mises à jour",
          `**${updatedCharacter.name}** a été modifié.`
        );

    embed.addFields(
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
      },
      {
        name: "Points mentaux",
        value: `${updatedCharacter.pm}`,
        inline: true,
      }
    );

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });

    // Log de la mort si le personnage vient de mourir
    if (updatedCharacter.isDead) {
      try {
        const { sendLogMessage } = await import("../../../utils/channels");
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
    const updatedCharacter = (await apiService.characters.updateCharacterStats(
      characterId,
      updateData
    )) as Character;

    const embed = createSuccessEmbed(
      "Stats avancées mises à jour",
      `**${updatedCharacter.name}** a été modifié.`
    ).addFields(
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
    );

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
