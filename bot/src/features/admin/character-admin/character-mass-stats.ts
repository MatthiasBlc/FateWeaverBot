/**
 * Gestion des modifications de masse pour les statistiques des personnages (PV, PM, FAIM, PA)
 */

import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { STATUS, CHARACTER, HUNGER, SYSTEM } from "../../../constants/emojis";
import type { Character, Town } from "../character-admin.types";
import {
  createCharacterMultiSelectMenu,
  createMassStatActionButtons,
  createMassStatModal,
} from "../character-admin.components";
import { storeSelection, getSelection } from "./mass-stats-cache";

/**
 * Récupère tous les personnages de la ville pour un serveur donné
 */
async function getCharactersForGuild(guildId: string): Promise<Character[]> {
  const town = (await apiService.guilds.getTownByGuildId(guildId)) as Town | null;
  if (!town || !town.id) {
    throw new Error("Ville non trouvée pour ce serveur");
  }
  return (await apiService.characters.getTownCharacters(town.id)) as Character[];
}

/**
 * Retourne l'emoji correspondant au type de stat
 */
function getStatEmoji(statType: "pv" | "pm" | "faim" | "pa"): string {
  const statEmojis = {
    pv: CHARACTER.HP_FULL,
    pm: CHARACTER.MP_FULL,
    faim: HUNGER.ICON,
    pa: CHARACTER.PA,
  };
  return statEmojis[statType];
}

/**
 * Handler pour le bouton de modification de masse de PV
 */
export async function handleMassPVButton(interaction: ButtonInteraction) {
  try {
    if (!interaction.guildId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Cette commande doit être utilisée dans un serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const characters = await getCharactersForGuild(interaction.guildId);
    const activeCharacters = characters.filter((char) => char.isActive);

    if (activeCharacters.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun personnage actif trouvé dans cette ville.`,
      });
      return;
    }

    const selectMenu = createCharacterMultiSelectMenu(
      characters,
      "pv",
      "Sélectionnez les personnages dont vous voulez modifier les PV"
    );

    await interaction.editReply({
      content: `${CHARACTER.HP_FULL} **Modification de masse - PV**\n\nSélectionnez les personnages à modifier :`,
      components: [selectMenu],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage du menu de sélection PV:", { error });
    if (interaction.deferred) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Erreur lors de la préparation du menu de sélection.`,
      });
    }
  }
}

/**
 * Handler pour le bouton de modification de masse de PM
 */
export async function handleMassPMButton(interaction: ButtonInteraction) {
  try {
    if (!interaction.guildId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Cette commande doit être utilisée dans un serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const characters = await getCharactersForGuild(interaction.guildId);
    const activeCharacters = characters.filter((char) => char.isActive);

    if (activeCharacters.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun personnage actif trouvé dans cette ville.`,
      });
      return;
    }

    const selectMenu = createCharacterMultiSelectMenu(
      characters,
      "pm",
      "Sélectionnez les personnages dont vous voulez modifier les PM"
    );

    await interaction.editReply({
      content: `${CHARACTER.MP_FULL} **Modification de masse - PM**\n\nSélectionnez les personnages à modifier :`,
      components: [selectMenu],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage du menu de sélection PM:", { error });
    if (interaction.deferred) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Erreur lors de la préparation du menu de sélection.`,
      });
    }
  }
}

/**
 * Handler pour le bouton de modification de masse de FAIM
 */
export async function handleMassFaimButton(interaction: ButtonInteraction) {
  try {
    if (!interaction.guildId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Cette commande doit être utilisée dans un serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const characters = await getCharactersForGuild(interaction.guildId);
    const activeCharacters = characters.filter((char) => char.isActive);

    if (activeCharacters.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun personnage actif trouvé dans cette ville.`,
      });
      return;
    }

    const selectMenu = createCharacterMultiSelectMenu(
      characters,
      "faim",
      "Sélectionnez les personnages dont vous voulez modifier la FAIM"
    );

    await interaction.editReply({
      content: `${HUNGER.ICON} **Modification de masse - FAIM**\n\nSélectionnez les personnages à modifier :`,
      components: [selectMenu],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage du menu de sélection FAIM:", { error });
    if (interaction.deferred) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Erreur lors de la préparation du menu de sélection.`,
      });
    }
  }
}

/**
 * Handler pour le bouton de modification de masse de PA
 */
export async function handleMassPAButton(interaction: ButtonInteraction) {
  try {
    if (!interaction.guildId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Cette commande doit être utilisée dans un serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const characters = await getCharactersForGuild(interaction.guildId);
    const activeCharacters = characters.filter((char) => char.isActive);

    if (activeCharacters.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun personnage actif trouvé dans cette ville.`,
      });
      return;
    }

    const selectMenu = createCharacterMultiSelectMenu(
      characters,
      "pa",
      "Sélectionnez les personnages dont vous voulez modifier les PA"
    );

    await interaction.editReply({
      content: `${CHARACTER.PA} **Modification de masse - PA**\n\nSélectionnez les personnages à modifier :`,
      components: [selectMenu],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage du menu de sélection PA:", { error });
    if (interaction.deferred) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Erreur lors de la préparation du menu de sélection.`,
      });
    }
  }
}

/**
 * Handler pour la sélection de personnages
 */
export async function handleMassStatsSelect(interaction: StringSelectMenuInteraction) {
  try {
    // Extract stat type from customId (format: mass_stats_select:pv|pm|faim|pa)
    const parts = interaction.customId.split(":");
    const statType = parts[1] as "pv" | "pm" | "faim" | "pa";

    const selectedCharacterIds = interaction.values;

    if (selectedCharacterIds.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Veuillez sélectionner au moins un personnage.`,
      });
      return;
    }

    // L'interaction est déjà defer dans handleCharacterAdminInteraction (ligne 213)
    // donc on utilise editReply au lieu de deferReply

    // Fetch selected characters to display their current stats
    const characterDetails: Array<{
      name: string;
      currentValue: number;
    }> = [];

    for (const characterId of selectedCharacterIds) {
      try {
        const character = (await apiService.characters.getCharacterById(
          characterId
        )) as Character;

        const statField =
          statType === "pv" ? "hp" :
          statType === "pm" ? "pm" :
          statType === "pa" ? "paTotal" :
          "hungerLevel";
        const currentValue = character[statField] as number;

        characterDetails.push({
          name: character.name,
          currentValue: currentValue,
        });
      } catch (error) {
        logger.error("Erreur lors de la récupération du personnage:", { error });
        // Continue avec les autres personnages
      }
    }

    // Stocker les IDs dans le cache et obtenir un ID de session
    const sessionId = storeSelection(selectedCharacterIds);

    const actionButtons = createMassStatActionButtons(statType, sessionId);

    const statEmoji = getStatEmoji(statType);

    // Build character list with current stats
    const characterList = characterDetails
      .map((char) => `• **${char.name}** : ${char.currentValue} ${statEmoji}`)
      .join("\n");

    await interaction.editReply({
      content: `${selectedCharacterIds.length} personnage${
        selectedCharacterIds.length > 1 ? "s" : ""
      } sélectionné${
        selectedCharacterIds.length > 1 ? "s" : ""
      }.\n\n**Personnages sélectionnés :**\n${characterList}\n\nVoulez-vous **ajouter** ou **retirer** des ${statEmoji} ?`,
      components: [actionButtons],
    });
  } catch (error) {
    logger.error("Erreur lors de la sélection des personnages:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors du traitement de la sélection.`,
    });
  }
}

/**
 * Handler pour les boutons Ajouter/Retirer
 */
export async function handleMassStatsAction(interaction: ButtonInteraction) {
  try {
    // Format: mass_stats_add:pv:sessionId ou mass_stats_remove:pm:sessionId
    const parts = interaction.customId.split(":");
    const action = parts[0].includes("add") ? "add" : "remove";
    const statType = parts[1] as "pv" | "pm" | "faim" | "pa";
    const sessionId = parts[2];

    // Récupérer les IDs depuis le cache
    const characterIds = getSelection(sessionId);

    if (!characterIds || characterIds.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée ou personnages non trouvés. Veuillez recommencer.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const modal = createMassStatModal(statType, action, sessionId);
    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur lors de l'affichage de la modale:", { error });
    // Si showModal échoue, on ne peut plus répondre car l'interaction est expirée
    // On log juste l'erreur
  }
}

/**
 * Handler pour la soumission de la modale de valeur
 */
export async function handleMassStatsModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    // Format: mass_stats_modal:add|remove:pv|pm|faim|pa:sessionId
    const parts = interaction.customId.split(":");
    const action = parts[1] as "add" | "remove";
    const statType = parts[2] as "pv" | "pm" | "faim" | "pa";
    const sessionId = parts[3];

    // Récupérer les IDs depuis le cache
    const characterIds = getSelection(sessionId);

    if (!characterIds || characterIds.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée ou personnages non trouvés. Veuillez recommencer.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const valueInput = interaction.fields.getTextInputValue("value_input");
    const value = parseInt(valueInput, 10);

    // Validation
    const maxValues = {
      pv: 5,
      pm: 5,
      faim: 4,
      pa: 4,
    };

    if (isNaN(value) || value < 0 || value > maxValues[statType]) {
      await interaction.editReply({
        content: `${STATUS.ERROR} La valeur doit être un nombre entre 0 et ${maxValues[statType]}.`,
      });
      return;
    }

    // L'interaction est déjà defer dans handleCharacterAdminInteraction (ligne 213)
    // donc on utilise editReply directement

    // Fetch all characters to show current and future stats
    const characterDetails: Array<{
      name: string;
      oldValue: number;
      newValue: number;
    }> = [];

    for (const characterId of characterIds) {
      try {
        const character = (await apiService.characters.getCharacterById(
          characterId
        )) as Character;

        const statField =
          statType === "pv" ? "hp" :
          statType === "pm" ? "pm" :
          statType === "pa" ? "paTotal" :
          "hungerLevel";
        const currentValue = character[statField] as number;

        // Calculate new value with clamping
        let newValue: number;
        if (action === "add") {
          newValue = currentValue + value;
        } else {
          newValue = currentValue - value;
        }

        // Clamp to valid range
        const maxValues = {
          pv: 5,
          pm: 5,
          faim: 4,
          pa: 4,
        };
        newValue = Math.max(0, Math.min(newValue, maxValues[statType]));

        characterDetails.push({
          name: character.name,
          oldValue: currentValue,
          newValue: newValue,
        });
      } catch (error) {
        logger.error("Erreur lors de la récupération du personnage:", { error });
        // Continue avec les autres personnages
      }
    }

    // Show confirmation buttons
    const statEmoji = getStatEmoji(statType);

    const confirmButtons = createActionButtons([
      {
        customId: `mass_stats_confirm_yes:${action}:${statType}:${value}:${sessionId}`,
        label: "Confirmer",
        style: ButtonStyle.Success,
      },
      {
        customId: `mass_stats_confirm_no`,
        label: "Annuler",
        style: ButtonStyle.Danger,
      },
    ]);

    // Build character list with old -> new stats
    const characterList = characterDetails
      .map(
        (char) =>
          `• **${char.name}** : ${char.oldValue} → ${char.newValue} ${statEmoji}`
      )
      .join("\n");

    await interaction.editReply({
      content: `${SYSTEM.WARNING} **Confirmation requise**\n\nVous êtes sur le point de ${
        action === "add" ? "ajouter" : "retirer"
      } **${value} ${statEmoji}** à **${characterIds.length} personnage${
        characterIds.length > 1 ? "s" : ""
      }**.\n\n**Modifications prévues :**\n${characterList}\n\n*Cette action est irréversible. Confirmez-vous ?*`,
      components: [confirmButtons],
    });
  } catch (error) {
    logger.error("Erreur lors de la validation de la modale:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la validation de la valeur.`,
    });
  }
}

/**
 * Handler pour la confirmation via bouton
 */
export async function handleMassStatsConfirmation(interaction: ButtonInteraction) {
  try {
    // Format: mass_stats_confirm_yes:add|remove:pv|pm|faim|pa:value:sessionId
    const parts = interaction.customId.split(":");
    const action = parts[1] as "add" | "remove";
    const statType = parts[2] as "pv" | "pm" | "faim" | "pa";
    const value = parseInt(parts[3], 10);
    const sessionId = parts[4];

    // Récupérer les IDs depuis le cache
    const characterIds = getSelection(sessionId);

    if (!characterIds || characterIds.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Session expirée ou personnages non trouvés. Veuillez recommencer.`,
      });
      return;
    }

    // L'interaction est déjà defer dans handleCharacterAdminInteraction (ligne 211 - deferUpdate)
    // donc on n'appelle PAS deferUpdate() ici

    // Apply changes to all selected characters
    const results = {
      success: [] as Array<{ name: string; oldValue: number; newValue: number }>,
      failed: [] as { name: string; error: string }[],
      deaths: [] as string[],
    };

    for (const characterId of characterIds) {
      try {
        // Fetch current character to calculate new value
        const character = (await apiService.characters.getCharacterById(
          characterId
        )) as Character;

        const statField =
          statType === "pv" ? "hp" :
          statType === "pm" ? "pm" :
          statType === "pa" ? "paTotal" :
          "hungerLevel";
        const currentValue = character[statField] as number;

        // Calculate new value with clamping
        let newValue: number;
        if (action === "add") {
          newValue = currentValue + value;
        } else {
          newValue = currentValue - value;
        }

        // Clamp to valid range
        const maxValues = {
          pv: 5,
          pm: 5,
          faim: 4,
          pa: 4,
        };
        newValue = Math.max(0, Math.min(newValue, maxValues[statType]));

        // Update character
        const updateData: any = {};
        if (statType === "pv") {
          updateData.hp = newValue;
        } else if (statType === "pm") {
          updateData.pm = newValue;
        } else if (statType === "faim") {
          updateData.hungerLevel = newValue;
        } else if (statType === "pa") {
          updateData.paTotal = newValue;
        }

        const updatedCharacter = (await apiService.characters.updateCharacterStats(
          characterId,
          updateData
        )) as Character;

        results.success.push({
          name: character.name,
          oldValue: currentValue,
          newValue: newValue,
        });

        // Check if character died (only for PV/PM, not PA)
        if ((statType === "pv" || statType === "pm") && updatedCharacter.isDead && !character.isDead) {
          results.deaths.push(character.name);
        }
      } catch (error) {
        const character = (await apiService.characters.getCharacterById(
          characterId
        ).catch(() => ({ name: "Personnage inconnu" }))) as Character;
        results.failed.push({
          name: character.name,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    // Log to admin channel
    if (interaction.guildId) {
      try {
        const { sendAdminLogMessage } = await import("../../../utils/channels");
        const statEmoji = getStatEmoji(statType);

        const successList = results.success
          .map((char) => `• ${char.name}: ${char.oldValue} → ${char.newValue} ${statEmoji}`)
          .join("\n");

        const logMessage = `${STATUS.STATS} **Modification de masse - ${statEmoji}**\nAdmin: <@${
          interaction.user.id
        }>\nAction: ${action === "add" ? "+" : "-"}${value} ${statEmoji}\nPersonnages modifiés:\n${successList}\n${
          results.deaths.length > 0
            ? `${SYSTEM.WARNING} Décès: ${results.deaths.join(", ")}\n`
            : ""
        }${
          results.failed.length > 0
            ? `${STATUS.ERROR} Échecs: ${results.failed.map((f) => f.name).join(", ")}\n`
            : ""
        }*${new Date().toLocaleString()}*`;

        await sendAdminLogMessage(
          interaction.guildId,
          interaction.client,
          logMessage
        );
      } catch (logError) {
        logger.error("Erreur lors de l'envoi du log admin:", { logError });
      }
    }

    // Build response embed
    const statEmoji = getStatEmoji(statType);

    const embed = createSuccessEmbed(
      "Modification de masse terminée",
      `${action === "add" ? "Ajout de" : "Retrait de"} ${value} ${statEmoji} effectué.`
    );

    if (results.success.length > 0) {
      const successList = results.success
        .map((char) => `• **${char.name}** : ${char.oldValue} → ${char.newValue} ${statEmoji}`)
        .join("\n");

      embed.addFields({
        name: `${STATUS.SUCCESS} Réussis (${results.success.length})`,
        value: successList,
        inline: false,
      });
    }

    if (results.deaths.length > 0) {
      embed.addFields({
        name: `💀 Décès (${results.deaths.length})`,
        value: results.deaths.join(", "),
        inline: false,
      });
    }

    if (results.failed.length > 0) {
      embed.addFields({
        name: `${STATUS.ERROR} Échecs (${results.failed.length})`,
        value: results.failed
          .map((f) => `${f.name}: ${f.error}`)
          .join("\n")
          .substring(0, 1024),
        inline: false,
      });
    }

    await interaction.editReply({
      content: "",  // Clear previous text content
      embeds: [embed],
      components: []  // Clear all buttons
    });
  } catch (error) {
    logger.error("Erreur lors de la confirmation de la modification:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'application des modifications.`,
    });
  }
}
