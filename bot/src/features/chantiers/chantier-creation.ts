import {
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  ComponentType,
} from "discord.js";
import { logger } from "../../services/logger";
import { apiService } from "../../services/api";
import { STATUS, CHANTIER } from "../../constants/emojis";
import { getStatusText } from "./chantiers.utils";

/**
 * Structure pour stocker temporairement un chantier en cours de création
 */
interface ChantierDraft {
  name: string;
  cost: number;
  guildId: string;
  userId: string;
  completionText?: string;
  resourceCosts: { resourceTypeId: number; quantity: number; name: string; emoji: string }[];
}

// Map pour stocker les brouillons de chantiers en cours de création
// Key: userId, Value: ChantierDraft
const chantierDrafts = new Map<string, ChantierDraft>();

/**
 * Handler pour la soumission du modal de création de chantier
 * Stocke les données et affiche les options pour ajouter des ressources
 */
export async function handleChantierCreateModal(interaction: ModalSubmitInteraction) {
  try {
    const name = interaction.fields.getTextInputValue("chantier_name").trim();
    const costInput = interaction.fields.getTextInputValue("chantier_cost").trim();
    const completionText = interaction.fields.getTextInputValue("chantier_completion_text")?.trim() || undefined;

    // Validation du coût
    const cost = parseInt(costInput, 10);
    if (isNaN(cost) || cost <= 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Le coût doit être un nombre entier positif.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Stocker le brouillon
    const draft: ChantierDraft = {
      name,
      cost,
      guildId: interaction.guildId!,
      userId: interaction.user.id,
      completionText,
      resourceCosts: [],
    };

    chantierDrafts.set(interaction.user.id, draft);

    // Créer les boutons d'action
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("chantier_add_resource")
        .setLabel("➕ Ajouter une ressource")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("chantier_create_final")
        .setLabel("✅ Créer le chantier")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: formatChantierDraft(draft),
      components: [buttons],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de la soumission du modal de création:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de la création du chantier.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Ajouter une ressource"
 * Affiche un menu de sélection des ressources disponibles
 */
export async function handleAddResourceButton(interaction: ButtonInteraction) {
  try {
    const draft = chantierDrafts.get(interaction.user.id);

    if (!draft) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer la création du chantier.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer toutes les ressources
    const allResources = (await apiService.getAllResourceTypes()) || [];

    if (allResources.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune ressource disponible.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Filtrer les ressources déjà ajoutées
    const addedResourceIds = new Set(draft.resourceCosts.map((rc) => rc.resourceTypeId));
    const availableResources = allResources.filter((r: any) => !addedResourceIds.has(r.id));

    if (availableResources.length === 0) {
      await interaction.reply({
        content: `${STATUS.INFO} Toutes les ressources ont déjà été ajoutées.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le menu de sélection (max 25 options)
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("chantier_select_resource")
      .setPlaceholder("Sélectionnez une ressource")
      .addOptions(
        availableResources.slice(0, 25).map((resource: any) => ({
          label: resource.name,
          description: resource.emoji || "Ressource",
          value: resource.id.toString(),
          emoji: resource.emoji || undefined,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Sélectionnez la ressource à ajouter :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de l'ajout de ressource:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'ajout de ressource.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la sélection d'une ressource
 * Ouvre un modal pour saisir la quantité
 */
export async function handleResourceSelect(interaction: StringSelectMenuInteraction) {
  try {
    const draft = chantierDrafts.get(interaction.user.id);

    if (!draft) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer la création du chantier.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const resourceId = parseInt(interaction.values[0], 10);

    // Récupérer les infos de la ressource
    const allResources = (await apiService.getAllResourceTypes()) || [];
    const resource = allResources.find((r: any) => r.id === resourceId);

    if (!resource) {
      await interaction.reply({
        content: `${STATUS.ERROR} Ressource non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le modal pour la quantité
    const modal = new ModalBuilder()
      .setCustomId(`chantier_resource_quantity_${resourceId}`)
      .setTitle(`Quantité de ${resource.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("resource_quantity")
      .setLabel(`Quantité de ${resource.emoji || ""} ${resource.name}`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(4)
      .setPlaceholder("Ex: 50");

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(quantityInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur lors de la sélection de ressource:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de la sélection de ressource.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la soumission du modal de quantité de ressource
 */
export async function handleResourceQuantityModal(interaction: ModalSubmitInteraction) {
  try {
    const draft = chantierDrafts.get(interaction.user.id);

    if (!draft) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer la création du chantier.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Extraire l'ID de la ressource depuis le customId
    const resourceId = parseInt(interaction.customId.split("_").pop()!, 10);
    const quantityInput = interaction.fields.getTextInputValue("resource_quantity").trim();

    // Validation de la quantité
    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} La quantité doit être un nombre entier positif.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les infos de la ressource
    const allResources = (await apiService.getAllResourceTypes()) || [];
    const resource = allResources.find((r: any) => r.id === resourceId);

    if (!resource) {
      await interaction.reply({
        content: `${STATUS.ERROR} Ressource non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Ajouter la ressource au brouillon
    draft.resourceCosts.push({
      resourceTypeId: resourceId,
      quantity,
      name: resource.name,
      emoji: resource.emoji || "",
    });

    chantierDrafts.set(interaction.user.id, draft);

    // Afficher le brouillon mis à jour avec les boutons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("chantier_add_resource")
        .setLabel("➕ Ajouter une autre ressource")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("chantier_create_final")
        .setLabel("✅ Créer le chantier")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: formatChantierDraft(draft),
      components: [buttons],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de l'ajout de la quantité:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'ajout de la quantité.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la création finale du chantier
 */
export async function handleCreateFinalButton(interaction: ButtonInteraction) {
  try {
    const draft = chantierDrafts.get(interaction.user.id);

    if (!draft) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer la création du chantier.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Créer le chantier via l'API
    const resourceCosts = draft.resourceCosts.map((rc) => ({
      resourceTypeId: rc.resourceTypeId,
      quantity: rc.quantity,
    }));

    const result = await apiService.chantiers.createChantier(
      {
        name: draft.name,
        cost: draft.cost,
        guildId: draft.guildId,
        completionText: draft.completionText,
        resourceCosts: resourceCosts.length > 0 ? resourceCosts : undefined,
      },
      draft.userId
    );

    // Nettoyer le brouillon
    chantierDrafts.delete(interaction.user.id);

    // Formater le message de succès
    let message = `${STATUS.SUCCESS} Chantier "${result.name}" créé avec succès !\n`;
    message += `${STATUS.STATS} Coût: ${result.cost} PA\n`;

    if (draft.resourceCosts.length > 0) {
      message += `${CHANTIER.ICON} Ressources requises:\n`;
      message += draft.resourceCosts
        .map((rc) => `  • ${rc.emoji} ${rc.quantity} ${rc.name}`)
        .join("\n");
      message += `\n`;
    }

    message += `📋 Statut: ${getStatusText(result.status)}`;

    await interaction.editReply({
      content: message,
    });
  } catch (error) {
    logger.error("Erreur lors de la création finale du chantier:", { error });
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors de la création du chantier.",
    });
  }
}

/**
 * Formate un brouillon de chantier pour l'affichage
 */
function formatChantierDraft(draft: ChantierDraft): string {
  let message = `${CHANTIER.ICON} **Nouveau chantier en préparation**\n\n`;
  message += `📝 **Nom:** ${draft.name}\n`;
  message += `${STATUS.STATS} **Coût PA:** ${draft.cost}\n`;

  if (draft.resourceCosts.length > 0) {
    message += `\n📦 **Ressources requises:**\n`;
    message += draft.resourceCosts
      .map((rc) => `  • ${rc.emoji} ${rc.quantity} ${rc.name}`)
      .join("\n");
  } else {
    message += `\n💡 *Aucune ressource requise pour le moment*`;
  }

  message += `\n\n*Ajoutez des ressources ou créez le chantier directement.*`;

  return message;
}
