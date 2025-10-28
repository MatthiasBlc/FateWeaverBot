import {
  createInfoEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
} from "../../utils/embeds";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  TextChannel,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import {
  createExpeditionModifyModal,
  createExpeditionDurationModal,
  createExpeditionResourceAddModal,
  createExpeditionResourceModifyModal,
} from "../../modals/expedition-modals";
import { ExpeditionAPIService } from "../../services/api/expedition-api.service";
import { Character, Expedition } from "../../types/entities";
import { apiService } from "../../services/api";

import { replyEphemeral, replyError } from "../../utils/interaction-helpers.js";
import {
  validateCharacterExists,
  validateCharacterAlive,
} from "../../utils/character-validation.js";
import { logger } from "../../services/logger";
import {
  handleExpeditionAdminResourceAddSelect,
  handleExpeditionResourceAddModal,
  handleExpeditionAdminResourceModifySelect,
  handleExpeditionResourceModifyModal,
  handleExpeditionAdminResourceDeleteSelect,
  handleExpeditionAdminResourceDeleteConfirm,
  handleExpeditionAdminResourceDeleteCancel,
  handleExpeditionDurationModal,
} from "./expedition-admin-resource-handlers";
import { EXPEDITION } from "@shared/constants/emojis.js";

export async function handleExpeditionAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    // Get all expeditions (including returned ones for admin)
    const expeditions = (await apiService.expeditions.getAllExpeditions(
      true
    )) as Expedition[];

    if (!expeditions || expeditions.length === 0) {
      await replyEphemeral(interaction, "❌ Aucune expédition trouvée.");
      return;
    }

    // Filter: at least one member AND not RETURNED
    const expeditionsWithMembers = expeditions.filter(
      (exp: Expedition) =>
        exp.members && exp.members.length > 0 && exp.status !== "RETURNED"
    );

    if (expeditionsWithMembers.length === 0) {
      await replyEphemeral(
        interaction,
        "❌ Aucune expédition active avec membres trouvée."
      );
      return;
    }

    // Create dropdown menu with expeditions
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_admin_select")
      .setPlaceholder("Sélectionnez une expédition à gérer")
      .addOptions(
        expeditionsWithMembers.map((exp: Expedition) => ({
          label: `${exp.name} (${exp.status})`,
          description: `Membres: ${exp.members?.length || 0}, Stock: ${
            exp.foodStock
          }`,
          value: exp.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const embed = createWarningEmbed(
      "🛠️ Administration des Expéditions",
      `**${expeditionsWithMembers.length}** expéditions avec membres trouvées`
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition admin command:", { error });
    await replyEphemeral(
      interaction,
      "❌ Une erreur est survenue lors de la récupération des expéditions."
    );
  }
}

export async function handleExpeditionAdminSelect(interaction: any) {
  try {
    const expeditionId = interaction.values[0];

    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(
      expeditionId
    );
    if (!expedition) {
      await replyEphemeral(interaction, "❌ Expédition non trouvée.");
      return;
    }

    // Create admin buttons
    const buttonRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`expedition_admin_modify_duration_${expeditionId}`)
        .setLabel("Modifier durée")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`expedition_admin_resources_${expeditionId}`)
        .setLabel("Gérer ressources")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`expedition_admin_members_${expeditionId}`)
        .setLabel("Gérer membres")
        .setStyle(ButtonStyle.Secondary)
    );

    const buttonRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`expedition_admin_channel_${expeditionId}`)
        .setLabel("📺 Configurer Channel")
        .setStyle(ButtonStyle.Secondary)
    );

    // Only show force return button for LOCKED or DEPARTED expeditions
    const components = [buttonRow1, buttonRow2];
    if (expedition.status === "LOCKED" || expedition.status === "DEPARTED") {
      const buttonRow3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_admin_return_${expeditionId}`)
          .setLabel("Retour forcé")
          .setStyle(ButtonStyle.Danger)
      );
      components.push(buttonRow3);
    }

    // Create embed with expedition details
    const embed = createWarningEmbed(
      `🛠️ ${expedition.name}`,
      "Détails de l'expédition"
    ).addFields(
      {
        name: "📦 Stock de nourriture",
        value: `${expedition.foodStock}`,
        inline: true,
      },
      { name: "⏱️ Durée", value: `${expedition.duration}h`, inline: true },
      {
        name: "📍 Statut",
        value: getStatusEmoji(expedition.status),
        inline: true,
      },
      {
        name: "👥 Membres",
        value: `${expedition.members?.length || 0}`,
        inline: true,
      },
      {
        name: "🏛️ Ville",
        value: expedition.town?.name || "Inconnue",
        inline: true,
      },
      {
        name: "👤 Créée par",
        value: `<@${expedition.createdBy}>`,
        inline: true,
      }
    );

    // Add channel field if configured
    if (expedition.expeditionChannelId) {
      embed.addFields({
        name: "📺 Channel Dédié",
        value: `<#${expedition.expeditionChannelId}>`,
        inline: true,
      });
    }

    await interaction.update({
      embeds: [embed],
      components: components,
    });
  } catch (error) {
    logger.error("Error in expedition admin select:", { error });
    await replyEphemeral(
      interaction,
      "❌ Une erreur est survenue lors de la récupération des détails de l'expédition."
    );
  }
}

export async function handleExpeditionAdminModifyDuration(
  interaction: any,
  expeditionId: string
) {
  try {
    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(
      expeditionId
    );
    if (!expedition) {
      await replyEphemeral(interaction, "❌ Expédition non trouvée.");
      return;
    }

    // Show duration modification modal
    const modal = createExpeditionDurationModal(
      expeditionId,
      expedition.duration
    );
    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in expedition admin modify duration:", { error });
    await replyEphemeral(
      interaction,
      "❌ Une erreur est survenue lors de l'ouverture du formulaire de modification."
    );
  }
}

export async function handleExpeditionModifyModal(interaction: any) {
  try {
    const expeditionId = interaction.customId.split("_")[3]; // Extract expedition ID from modal custom ID (expedition_modify_modal_${expeditionId})
    const duration = interaction.fields.getTextInputValue(
      "modify_duration_input"
    );
    const foodStock = interaction.fields.getTextInputValue(
      "modify_food_stock_input"
    );

    // Validate inputs
    const durationValue = parseInt(duration, 10);
    const foodStockValue = parseInt(foodStock, 10);

    if (isNaN(durationValue) || durationValue < 1) {
      await replyEphemeral(
        interaction,
        "❌ La durée doit être un nombre positif d'au moins 1 jour."
      );
      return;
    }

    if (isNaN(foodStockValue) || foodStockValue < 0) {
      await replyEphemeral(
        interaction,
        "❌ Le stock de nourriture doit être un nombre positif."
      );
      return;
    }

    // Call API to modify expedition
    const updatedExpedition = await apiService.modifyExpedition(expeditionId, {
      duration: durationValue,
      foodStock: foodStockValue,
    });

    // Update the original admin interface
    await interaction.update({
      content: `✅ Expédition **${updatedExpedition.name}** modifiée avec succès!\n\n📦 Nouveau stock: **${foodStockValue}**\n⏱️ Nouvelle durée: **${durationValue} jours**`,
      embeds: [],
      components: [],
    });

    logger.info("Expedition modified via admin command", {
      expeditionId,
      expeditionName: updatedExpedition.name,
      oldDuration: durationValue,
      newDuration: durationValue,
      oldFoodStock: foodStockValue,
      newFoodStock: foodStockValue,
      adminUserId: interaction.user.id,
    });
  } catch (error) {
    logger.error("Error in expedition modify modal:", { error });
    await replyEphemeral(
      interaction,
      `❌ Erreur lors de la modification de l'expédition: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
}

export async function handleExpeditionAdminMembers(
  interaction: any,
  expeditionId: string
) {
  try {
    // Get expedition details
    const expedition = (await apiService.expeditions.getExpeditionById(
      expeditionId
    )) as Expedition;
    if (!expedition) {
      await interaction.reply({
        content: "❌ Expédition non trouvée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get all characters in the guild/town for selection
    const guildId = expedition.townId; // Assuming this is the guild ID or we need to get it differently
    const characters = (await apiService.characters.getTownCharacters(
      expedition.townId
    )) as Character[];

    if (!characters || characters.length === 0) {
      await replyEphemeral(
        interaction,
        "❌ Aucun personnage trouvé dans cette ville."
      );
      return;
    }

    // Filter characters: not already in expedition, alive, and active
    const availableCharacters = characters.filter(
      (char) =>
        !expedition.members?.some(
          (member: { character: { id: string } }) =>
            member.character.id === char.id
        ) &&
        !char.isDead &&
        char.isActive
    );

    if (availableCharacters.length === 0) {
      await replyEphemeral(
        interaction,
        "❌ Aucun personnage disponible (vivant et actif) dans cette ville."
      );
      return;
    }

    // Create dropdown for adding members (multi-select enabled)
    const addSelectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_add_member_${expeditionId}`)
      .setPlaceholder("Sélectionnez un ou plusieurs personnages à ajouter")
      .setMinValues(1)
      .setMaxValues(Math.min(availableCharacters.length, 25)) // Discord max 25
      .addOptions(
        availableCharacters.map((char) => ({
          label: char.name,
          description: `Utilisateur: ${char.user?.username || "Inconnu"}`,
          value: char.id,
        }))
      );

    // Create dropdown for removing members (if expedition has members)
    const components = [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        addSelectMenu
      ),
    ];

    if (expedition.members && expedition.members.length > 0) {
      const removeSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`expedition_admin_remove_member_${expeditionId}`)
        .setPlaceholder("Sélectionnez un membre à retirer")
        .addOptions(
          expedition.members.map((member) => ({
            label: member.character.name,
            description: `Utilisateur: ${
              member.character.user?.username || "Inconnu"
            }`,
            value: member.character.id,
          }))
        );

      components.push(
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          removeSelectMenu
        )
      );
    }

    // Create embed with current member list
    const memberList =
      expedition.members
        ?.map(
          (member) =>
            `• ${member.character.name} (${
              member.character.user?.username || "Inconnu"
            })`
        )
        .join("\n") || "Aucun membre";

    const embed = createWarningEmbed(
      `👥 Gestion des membres - ${expedition.name}`,
      `**Membres actuels (${expedition.members?.length || 0}):**\n${memberList}`
    ).addFields(
      {
        name: "➕ Ajouter un membre",
        value: `${availableCharacters.length} personnage(s) disponible(s)`,
        inline: true,
      },
      {
        name: "➖ Retirer un membre",
        value:
          (expedition.members?.length || 0) > 0
            ? `${expedition.members?.length} membre(s)`
            : "Aucun membre",
        inline: true,
      },
      {
        name: "📍 Ville",
        value: expedition.town?.name || "Inconnue",
        inline: true,
      }
    );

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition admin members:", { error });
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de l'affichage de la gestion des membres.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionAdminAddMember(interaction: any) {
  try {
    const parts = interaction.customId.split("_"); // expedition_admin_add_member_${expeditionId}
    const expeditionId = parts[parts.length - 1]; // Get last part (expedition ID)
    const characterIds = interaction.values; // Array of character IDs

    // Add all selected members to expedition
    const results = [];
    for (const characterId of characterIds) {
      try {
        // Get character details to check status
        const character = await apiService.characters.getCharacterById(
          characterId
        );

        // Validate character exists and is alive
        validateCharacterExists(character);
        validateCharacterAlive(character);

        // Add member to expedition
        await apiService.addMemberToExpedition(expeditionId, characterId);
        results.push({ success: true, name: character.name, characterId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error("Error adding single member to expedition:", {
          characterId,
          error: errorMessage,
        });
        results.push({
          success: false,
          name: characterId,
          characterId,
          error: errorMessage,
        });
      }
    }

    // Get updated expedition info
    const expedition = await apiService.expeditions.getExpeditionById(
      expeditionId
    );

    // Update the message with new member count
    const memberList =
      expedition?.members
        ?.map(
          (member) =>
            `• ${member.character.name} (${
              member.character.user?.username || "Inconnu"
            })`
        )
        .join("\n") || "Aucun membre";

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    const embed = createSuccessEmbed(
      `✅ Membres ajoutés - ${expedition?.name}`,
      `**Résultat:** ${successCount} ajouté(s), ${failCount} échoué(s)\n\n**Membres actuels (${
        expedition?.members?.length || 0
      }):**\n${memberList}`
    );

    await interaction.update({
      embeds: [embed],
      components: [],
    });

    logger.info("Members added to expedition via admin", {
      expeditionId,
      expeditionName: expedition?.name,
      characterIds,
      successCount,
      failCount,
      adminUserId: interaction.user.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error adding members to expedition:", {
      error: errorMessage,
    });
    await replyEphemeral(
      interaction,
      `❌ Erreur lors de l'ajout des membres: ${errorMessage}`
    );
  }
}

export async function handleExpeditionAdminRemoveMember(interaction: any) {
  try {
    const parts = interaction.customId.split("_"); // expedition_admin_remove_member_${expeditionId}
    const expeditionId = parts[parts.length - 1]; // Get last part (expedition ID)
    const characterId = interaction.values[0];

    // Remove member from expedition
    await apiService.removeMemberFromExpedition(expeditionId, characterId);

    // Get updated expedition info
    const expedition = await apiService.expeditions.getExpeditionById(
      expeditionId
    );

    // Update the message with new member count
    const memberList =
      expedition?.members
        ?.map(
          (member) =>
            `• ${member.character.name} (${
              member.character.user?.username || "Inconnu"
            })`
        )
        .join("\n") || "Aucun membre";

    const embed = createErrorEmbed(
      `Membre retiré - ${expedition?.name}`,
      `**Membres actuels (${
        expedition?.members?.length || 0
      }):**\n${memberList}`
    );

    await interaction.update({
      embeds: [embed],
      components: [],
    });

    logger.info("Member removed from expedition via admin", {
      expeditionId,
      expeditionName: expedition?.name,
      characterId,
      adminUserId: interaction.user.id,
    });
  } catch (error) {
    logger.error("Error removing member from expedition:", { error });
    await replyEphemeral(
      interaction,
      `❌ Erreur lors du retrait du membre: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
}

export async function handleExpeditionAdminReturn(
  interaction: any,
  expeditionId: string
) {
  try {
    // Force return the expedition
    const expedition = await apiService.forceReturnExpedition(expeditionId);

    await interaction.update({
      content: `✅ Expédition **${expedition.name}** retournée de force avec succès!`,
      embeds: [],
      components: [],
    });

    logger.info("Expedition force returned via admin command", {
      expeditionId,
      expeditionName: expedition.name,
      adminUserId: interaction.user.id,
    });
  } catch (error) {
    logger.error("Error in expedition admin return:", { error });
    await replyEphemeral(
      interaction,
      `❌ Erreur lors du retour forcé de l'expédition: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
}

export function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLANNING":
      return `${EXPEDITION.PLANNING} Planification`;
    case "LOCKED":
      return `${EXPEDITION.LOCKED} Verrouillée`;
    case "DEPARTED":
      return `${EXPEDITION.DEPARTED} En route`;
    case "RETURNED":
      return `${EXPEDITION.RETURNED} De retour`;
    default:
      return status;
  }
}

export async function handleExpeditionAdminResources(
  interaction: any,
  expeditionId: string
) {
  try {
    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(
      expeditionId
    );
    if (!expedition) {
      await replyEphemeral(interaction, "❌ Expédition non trouvée.");
      return;
    }

    // Create resource management buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`expedition_admin_resource_add_${expeditionId}`)
        .setLabel("➕ Ajouter")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`expedition_admin_resource_modify_${expeditionId}`)
        .setLabel("✏️ Modifier")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`expedition_admin_resource_delete_${expeditionId}`)
        .setLabel("🗑️ Supprimer")
        .setStyle(ButtonStyle.Danger)
    );

    // Get expedition resources
    const resources = await apiService.resources.getResourcesForLocation(
      "EXPEDITION",
      expeditionId
    );
    const resourceList =
      resources && resources.length > 0
        ? resources
            .map(
              (r: any) =>
                `• ${r.resourceType?.name || "Inconnu"}: ${r.quantity}`
            )
            .join("\n")
        : "Aucune ressource";

    const embed = createWarningEmbed(
      `📦 Gestion des ressources - ${expedition.name}`,
      `**Ressources actuelles:**\n${resourceList}`
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttonRow],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition admin resources:", { error });
    await replyEphemeral(
      interaction,
      "❌ Une erreur est survenue lors de l'affichage de la gestion des ressources."
    );
  }
}

export async function handleExpeditionAdminResourceAdd(
  interaction: any,
  expeditionId: string
) {
  try {
    // Get all resource types
    const resourceTypes = await apiService.getResourceTypes();

    if (!resourceTypes || resourceTypes.length === 0) {
      await replyEphemeral(interaction, "❌ Aucun type de ressource trouvé.");
      return;
    }

    // Create dropdown for resource selection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_resource_add_select_${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à ajouter")
      .addOptions(
        resourceTypes.map((rt: any) => {
          // Trim description to max 100 chars for Discord limit
          const description = rt.description && rt.description.trim()
            ? rt.description.substring(0, 100)
            : "Aucune description";

          const option: any = {
            label: rt.name,
            description: description,
            value: rt.id.toString(),
          };
          // Only add emoji if it exists and is valid
          if (rt.emoji) {
            option.emoji = rt.emoji;
          }
          return option;
        })
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const embed = createInfoEmbed("➕ Ajouter une ressource").setDescription(
      "Sélectionnez la ressource à ajouter à l'expédition"
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  } catch (error) {
    logger.error("Error in expedition admin resource add:", {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
      expeditionId
    });
    await replyEphemeral(
      interaction,
      "❌ Erreur lors de l'ajout de ressource."
    );
  }
}

export async function handleExpeditionAdminResourceModify(
  interaction: any,
  expeditionId: string
) {
  try {
    // Get expedition resources
    const resources = await apiService.resources.getResourcesForLocation(
      "EXPEDITION",
      expeditionId
    );

    if (!resources || resources.length === 0) {
      await replyEphemeral(
        interaction,
        "❌ Aucune ressource trouvée pour cette expédition."
      );
      return;
    }

    // Create dropdown for resource selection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_resource_modify_select_${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à modifier")
      .addOptions(
        resources.map((r: any) => ({
          label: `${r.resourceType?.name || "Inconnu"} (${r.quantity})`,
          description: `ID: ${r.resourceTypeId} - Stock actuel: ${r.quantity}`,
          value: `${r.resourceTypeId}`,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const embed = createInfoEmbed(
      "✏️ Modifier une ressource",
      "Sélectionnez la ressource dont vous voulez modifier la quantité"
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  } catch (error) {
    logger.error("Error in expedition admin resource modify:", { error });
    await replyEphemeral(
      interaction,
      "❌ Erreur lors de la modification de ressource."
    );
  }
}

export async function handleExpeditionAdminResourceDelete(
  interaction: any,
  expeditionId: string
) {
  try {
    // Get expedition resources
    const resources = await apiService.resources.getResourcesForLocation(
      "EXPEDITION",
      expeditionId
    );

    if (!resources || resources.length === 0) {
      await replyEphemeral(
        interaction,
        "❌ Aucune ressource trouvée pour cette expédition."
      );
      return;
    }

    // Create dropdown for resource selection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_resource_delete_select_${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à supprimer")
      .addOptions(
        resources.map((r: any) => ({
          label: `${r.resourceType?.name || "Inconnu"} (${r.quantity})`,
          description: `Stock: ${r.quantity} - Sera complètement supprimé`,
          value: `${r.resourceTypeId}`,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const embed = createErrorEmbed(
      "🗑️ Supprimer une ressource",
      "⚠️ La ressource et tout son stock seront supprimés de l'expédition"
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  } catch (error) {
    logger.error("Error in expedition admin resource delete:", { error });
    await replyEphemeral(
      interaction,
      "❌ Erreur lors de la suppression de ressource."
    );
  }
}

export async function handleExpeditionAdminButton(interaction: any) {
  try {
    const customId = interaction.customId;

    if (customId.startsWith("expedition_admin_modify_duration_")) {
      const expeditionId = customId.replace(
        "expedition_admin_modify_duration_",
        ""
      );
      await handleExpeditionAdminModifyDuration(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_resources_")) {
      const expeditionId = customId.replace("expedition_admin_resources_", "");
      await handleExpeditionAdminResources(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_resource_add_")) {
      const expeditionId = customId.replace(
        "expedition_admin_resource_add_",
        ""
      );
      await handleExpeditionAdminResourceAdd(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_resource_modify_")) {
      const expeditionId = customId.replace(
        "expedition_admin_resource_modify_",
        ""
      );
      await handleExpeditionAdminResourceModify(interaction, expeditionId);
    } else if (
      customId.startsWith("expedition_admin_resource_delete_confirm_")
    ) {
      await handleExpeditionAdminResourceDeleteConfirm(interaction);
    } else if (
      customId.startsWith("expedition_admin_resource_delete_cancel_")
    ) {
      await handleExpeditionAdminResourceDeleteCancel(interaction);
    } else if (customId.startsWith("expedition_admin_resource_delete_")) {
      const expeditionId = customId.replace(
        "expedition_admin_resource_delete_",
        ""
      );
      await handleExpeditionAdminResourceDelete(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_members_")) {
      const expeditionId = customId.replace("expedition_admin_members_", "");
      await handleExpeditionAdminMembers(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_return_")) {
      const expeditionId = customId.replace("expedition_admin_return_", "");
      await handleExpeditionAdminReturn(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_channel_")) {
      const expeditionId = customId.replace("expedition_admin_channel_", "");
      await handleExpeditionAdminConfigureChannel(interaction, expeditionId);
    } else {
      await replyEphemeral(
        interaction,
        "⚠️ Action d'administration d'expédition non reconnue"
      );
    }
  } catch (error) {
    logger.error("Error in expedition admin button:", { error });
    await replyEphemeral(
      interaction,
      "❌ Erreur lors de l'administration de l'expédition"
    );
  }
}

/**
 * Handler: expedition_admin_channel_${expeditionId}
 * Affiche la sélection du channel Discord
 */
async function handleExpeditionAdminConfigureChannel(
  interaction: ButtonInteraction,
  expeditionId: string
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer l'expédition
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.editReply({
        content: "❌ Expédition introuvable.",
      });
      return;
    }

    // Récupérer tous les canaux textuels du serveur
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({
        content: "❌ Impossible de récupérer les informations du serveur.",
      });
      return;
    }

    const channels = guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildText)
      .sort((a, b) => a.position - b.position);

    // Créer le menu de sélection (max 25 options)
    const options: StringSelectMenuOptionBuilder[] = [
      new StringSelectMenuOptionBuilder()
        .setLabel("🚫 Aucun (désactiver)")
        .setValue("none")
        .setDescription("Désactiver le channel dédié pour cette expédition"),
    ];

    channels.forEach((channel) => {
      if (options.length < 25) {
        const textChannel = channel as TextChannel;
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(`#${textChannel.name}`)
            .setValue(textChannel.id)
            .setDescription(`Catégorie: ${textChannel.parent?.name || "Aucune"}`)
        );
      }
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_channel_select:${expeditionId}`)
      .setPlaceholder("Sélectionnez un channel pour cette expédition")
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const currentChannelText = expedition.expeditionChannelId
      ? `<#${expedition.expeditionChannelId}>`
      : "Aucun configuré";

    await interaction.editReply({
      content: `📺 **Configuration du Channel pour "${expedition.name}"**\n\n` +
        `Channel actuel : ${currentChannelText}\n\n` +
        `Sélectionnez un channel Discord où les logs de cette expédition seront envoyés pendant qu'elle est DEPARTED.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Error in handleExpeditionAdminConfigureChannel:", error);
    await interaction.editReply({
      content: "❌ Une erreur est survenue.",
    });
  }
}

/**
 * Handler: expedition_channel_select:${expeditionId}
 * Confirme et enregistre le channel sélectionné
 */
export async function handleExpeditionChannelSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const expeditionId = interaction.customId.split(":")[1];
    const selectedChannelId = interaction.values[0];

    // Récupérer l'expédition
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.editReply({
        content: "❌ Expédition introuvable.",
      });
      return;
    }

    // Préparer les données
    const channelId = selectedChannelId === "none" ? null : selectedChannelId;

    // Appel API pour configurer le channel
    await apiService.expeditions.setExpeditionChannel(
      expeditionId,
      channelId,
      interaction.user.id
    );

    // Message de confirmation
    const confirmMessage = channelId
      ? `✅ Channel <#${channelId}> configuré pour l'expédition **${expedition.name}**.\n\n` +
        `Les logs seront envoyés dans ce channel lorsque l'expédition sera en statut DEPARTED.`
      : `✅ Channel dédié désactivé pour l'expédition **${expedition.name}**.\n\n` +
        `Les logs seront envoyés dans le channel de logs global.`;

    await interaction.editReply({
      content: confirmMessage,
      components: [],
    });
  } catch (error) {
    logger.error("Error in handleExpeditionChannelSelect:", error);
    await interaction.editReply({
      content: "❌ Erreur lors de la configuration du channel.",
    });
  }
}
