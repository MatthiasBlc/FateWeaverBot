import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import type { Character } from "../character-admin.types";
import {
  createCapabilitySelectMenu,
  createCapabilityActionButtons,
  type Capability,
} from "../character-admin.components";
import { getCharacterCapabilities } from "../../../services/capability.service";
import { httpClient } from "../../../services/httpClient";

/**
 * Gestionnaire pour le bouton "Gérer Capacités".
 * Affiche directement les capacités actuelles du personnage avec les boutons d'action.
 */
export async function handleCapabilitiesButton(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer les capacités actuelles du personnage
    const currentCapabilities = await getCharacterCapabilities(character.id);

    // Créer la liste des capacités formatée
    let content = `## 🔮 Capacités de ${character.name}\n`;

    if (currentCapabilities.length === 0) {
      content += "*Aucune capacité pour le moment.*\n\n";
    } else {
      content += currentCapabilities
        .map(cap => `• **${cap.name}** (${cap.costPA} PA)${cap.description ? `\n  ${cap.description}` : ''}`)
        .join('\n') + '\n\n';
    }

    // Créer les boutons d'action
    const actionButtons = createCapabilityActionButtons(character.id);

    await interaction.editReply({
      content,
      components: [actionButtons],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage des capacités:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
      return; // Interaction expirée
    }
    await interaction.reply({
      content: "❌ Erreur lors de l'affichage des capacités.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gestionnaire pour l'ajout de capacités.
 * Affiche uniquement les capacités que le personnage ne possède pas encore.
 */
export async function handleAddCapabilities(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer toutes les capacités et celles du personnage
    const [allCapabilitiesResponse, currentCapabilities] = await Promise.all([
      httpClient.get('/capabilities'),
      getCharacterCapabilities(character.id)
    ]);

    const allCapabilities = allCapabilitiesResponse.data || [];
    const currentCapabilityIds = new Set(currentCapabilities.map(c => c.id));

    // Filtrer pour ne garder que les capacités non possédées
    const availableCapabilities = allCapabilities.filter(
      (cap: any) => !currentCapabilityIds.has(cap.id)
    );

    if (availableCapabilities.length === 0) {
      await interaction.editReply({
        content: `ℹ️ **${character.name}** possède déjà toutes les capacités disponibles.`,
      });
      return;
    }

    const selectMenu = createCapabilitySelectMenu(
      availableCapabilities,
      [],
      'Sélectionnez les capacités à ajouter',
      character.id
    );

    await interaction.editReply({
      content: `## ➕ Ajouter des capacités à ${character.name}\nChoisissez dans la liste les capacités à ajouter :`,
      components: [selectMenu],
    });
  } catch (error) {
    logger.error("Erreur lors de la préparation de l'ajout de capacités:", { error });
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur lors de la préparation de l'ajout de capacités.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de la préparation de l'ajout de capacités.",
      });
    }
  }
}

/**
 * Gestionnaire pour la suppression de capacités.
 * Affiche uniquement les capacités que le personnage possède déjà.
 */
export async function handleRemoveCapabilities(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer les capacités actuelles du personnage
    const currentCapabilities = await getCharacterCapabilities(character.id);

    if (currentCapabilities.length === 0) {
      await interaction.editReply({
        content: `ℹ️ **${character.name}** n'a aucune capacité à retirer.`,
      });
      return;
    }

    // Créer un menu de sélection avec uniquement les capacités actuelles
    const selectMenu = createCapabilitySelectMenu(
      currentCapabilities,
      [],
      'Sélectionnez les capacités à retirer',
      character.id
    );

    await interaction.editReply({
      content: `## ➖ Retirer des capacités de ${character.name}\nSélectionnez les capacités à retirer :`,
      components: [selectMenu],
    });
  } catch (error) {
    logger.error("Erreur lors de la préparation de la suppression de capacités:", { error });
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur lors de la préparation de la suppression de capacités.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de la préparation de la suppression de capacités.",
      });
    }
  }
}

/**
 * Gestionnaire pour afficher les capacités actuelles.
 */
export async function handleViewCapabilities(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    const capabilities = await getCharacterCapabilities(character.id);

    if (capabilities.length === 0) {
      await interaction.reply({
        content: `🔮 **${character.name}** ne connaît aucune capacité.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const capabilitiesList = capabilities
      .map(cap => `• **${cap.name}** (${cap.costPA} PA)`)
      .join('\n');

    const embed = createInfoEmbed(
      `🔮 Capacités de ${character.name}`,
      capabilitiesList
    ).setFooter({
      text: `${capabilities.length} capacité${capabilities.length > 1 ? 's' : ''} connue${capabilities.length > 1 ? 's' : ''}`,
    });

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de l'affichage des capacités:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'affichage des capacités.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gestionnaire pour la sélection de capacités dans le menu.
 */
export async function handleCapabilitySelect(
  interaction: StringSelectMenuInteraction,
  character: Character | null,
  action: 'add' | 'remove'
) {
  try {
    const selectedCapabilityIds = interaction.values;

    if (selectedCapabilityIds.length === 0) {
      await interaction.reply({
        content: "❌ Aucune capacité sélectionnée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Personnage non trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    const results = [];

    for (const capabilityId of selectedCapabilityIds) {
      try {
        // Vérifier que la capacité existe avant de l'ajouter
        if (action === 'add') {
          const capabilitiesResponse = await httpClient.get('/capabilities');
          const allCapabilities = capabilitiesResponse.data || [];
          const capabilityExists = allCapabilities.some((cap: any) => cap.id === capabilityId);

          if (!capabilityExists) {
            results.push(`❌ Capacité non trouvée: ${capabilityId}`);
            continue;
          }
        }

        if (action === 'add') {
          await httpClient.post(`/characters/${character.id}/capabilities/${capabilityId}`);
          results.push(`✅ Capacité ajoutée`);
        } else {
          await httpClient.delete(`/characters/${character.id}/capabilities/${capabilityId}`);
          results.push(`✅ Capacité retirée`);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error.message || 'Erreur inconnue';
        results.push(`❌ Erreur: ${errorMessage}`);
      }
    }

    const embed = action === 'add'
      ? createSuccessEmbed('Ajout de capacités', results.join('\n')).setFooter({
          text: `${selectedCapabilityIds.length} capacité${selectedCapabilityIds.length > 1 ? 's' : ''} ajoutée${selectedCapabilityIds.length > 1 ? 's' : ''}`,
        })
      : createErrorEmbed('Suppression de capacités', results.join('\n')).setFooter({
          text: `${selectedCapabilityIds.length} capacité${selectedCapabilityIds.length > 1 ? 's' : ''} retirée${selectedCapabilityIds.length > 1 ? 's' : ''}`,
        });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error(`Erreur lors de ${action === 'add' ? 'l\'ajout' : 'la suppression'} de capacités:`, { error });
    await interaction.reply({
      content: `❌ Erreur lors de ${action === 'add' ? 'l\'ajout' : 'la suppression'} des capacités.`,
      flags: ["Ephemeral"],
    });
  }
}
