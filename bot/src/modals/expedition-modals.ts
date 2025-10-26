import { RESOURCES } from "@shared/constants/emojis";
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

/**
 * Modal pour créer une nouvelle expédition avec sélection de vivres et nourriture uniquement
 */
export function createExpeditionCreationModal() {
  const modal = new ModalBuilder()
    .setCustomId("expedition_creation_modal")
    .setTitle("Créer une expédition");

  const nameInput = new TextInputBuilder()
    .setCustomId("expedition_name_input")
    .setLabel("Nom de l'expédition")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Nom de l'expédition")
    .setMinLength(1)
    .setMaxLength(100);

  const vivresInput = new TextInputBuilder()
    .setCustomId("expedition_vivres_input")
    .setLabel(`${RESOURCES.FOOD} Vivres à emporter`)
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("Quantité de vivres (ex: 50)")
    .setMinLength(1)
    .setMaxLength(10);

  const nourritureInput = new TextInputBuilder()
    .setCustomId("expedition_nourriture_input")
    .setLabel(`${RESOURCES.PREPARED_FOOD} Repas à emporter`)
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("Quantité de nourriture (ex: 25)")
    .setMinLength(1)
    .setMaxLength(10);

  const durationInput = new TextInputBuilder()
    .setCustomId("expedition_duration_input")
    .setLabel("Durée de l'expédition (jours)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Durée en jours (ex: 3, minimum 1)")
    .setMinLength(1)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(vivresInput);
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nourritureInput);
  const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput);

  modal.addComponents([firstRow, secondRow, thirdRow, fourthRow]);

  return modal;
}

/**
 * Modal pour modifier une expédition (admin)
 */
export function createExpeditionModifyModal(expeditionId: string, currentDuration: number, currentFoodStock: number) {
  const modal = new ModalBuilder()
    .setCustomId(`expedition_modify_modal_${expeditionId}`)
    .setTitle("Modifier l'expédition");

  const durationInput = new TextInputBuilder()
    .setCustomId("modify_duration_input")
    .setLabel("Durée (jours)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(`Durée actuelle: ${currentDuration} jours`)
    .setMinLength(1)
    .setMaxLength(10);

  const foodStockInput = new TextInputBuilder()
    .setCustomId("modify_food_stock_input")
    .setLabel("Stock de nourriture")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(`Stock actuel: ${currentFoodStock}`)
    .setMinLength(1)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(foodStockInput);

  modal.addComponents([firstRow, secondRow]);

  return modal;
}

/**
 * Modal pour transférer de la nourriture entre la ville et l'expédition
 */
export function createExpeditionTransferModal(expeditionId: string, currentFoodStock: number, townFoodStock: number) {
  const modal = new ModalBuilder()
    .setCustomId(`expedition_transfer_modal_${expeditionId}`)
    .setTitle("Transférer de la nourriture");

  const amountInput = new TextInputBuilder()
    .setCustomId("transfer_amount_input")
    .setLabel("Quantité de nourriture à transférer")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(`Montant (max: ${Math.max(currentFoodStock, townFoodStock)})`)
    .setMinLength(1)
    .setMaxLength(10);

  const directionInput = new TextInputBuilder()
    .setCustomId("transfer_direction_input")
    .setLabel("Direction (to_town/from_town)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Tapez 'to_town' ou 'from_town'")
    .setMinLength(1)
    .setMaxLength(10);

  const amountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
  const directionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(directionInput);

  modal.addComponents([amountRow, directionRow]);

  return modal;
}

/**
 * Modal pour saisir le montant de ressources à transférer (direction déjà choisie)
 * Supporte Vivres ET Repas dans une seule opération
 */
export function createExpeditionTransferAmountModal(
  expeditionId: string,
  direction: "to_town" | "from_town",
  maxVivres: number,
  maxRepas: number
) {
  const modal = new ModalBuilder()
    .setCustomId(`expedition_transfer_amount_modal_${expeditionId}_${direction}`)
    .setTitle(`Transférer des ressources ${direction === "to_town" ? "vers la ville" : "vers l'expédition"}`);

  const vivresInput = new TextInputBuilder()
    .setCustomId("transfer_vivres_input")
    .setLabel("🍞 Vivres à transférer")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder(`Quantité (max: ${maxVivres}, laissez vide si 0)`)
    .setMinLength(1)
    .setMaxLength(10);

  const nourritureInput = new TextInputBuilder()
    .setCustomId("transfer_nourriture_input")
    .setLabel("🍖 Repas à transférer")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder(`Quantité (max: ${maxRepas}, laissez vide si 0)`)
    .setMinLength(1)
    .setMaxLength(10);

  const vivresRow = new ActionRowBuilder<TextInputBuilder>().addComponents(vivresInput);
  const nourritureRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nourritureInput);

  modal.addComponents([vivresRow, nourritureRow]);

  return modal;
}

/**
 * Modal pour modifier uniquement la durée d'une expédition (admin)
 */
export function createExpeditionDurationModal(expeditionId: string, currentDuration: number) {
  const modal = new ModalBuilder()
    .setCustomId(`expedition_duration_modal_${expeditionId}`)
    .setTitle("Modifier la durée");

  const durationInput = new TextInputBuilder()
    .setCustomId("duration_input")
    .setLabel("Durée (jours)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(currentDuration.toString())
    .setPlaceholder(`Durée actuelle: ${currentDuration} jours`)
    .setMinLength(1)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput);

  modal.addComponents([firstRow]);

  return modal;
}

/**
 * Modal pour ajouter une quantité de ressource à une expédition (admin)
 */
export function createExpeditionResourceAddModal(expeditionId: string, resourceTypeId: number, resourceName: string) {
  const modal = new ModalBuilder()
    .setCustomId(`expedition_resource_add_modal_${expeditionId}_${resourceTypeId}`)
    .setTitle(`Ajouter ${resourceName}`);

  const quantityInput = new TextInputBuilder()
    .setCustomId("resource_quantity_input")
    .setLabel("Quantité")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Quantité à ajouter (ex: 10)")
    .setMinLength(1)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);

  modal.addComponents([firstRow]);

  return modal;
}

/**
 * Modal pour modifier la quantité d'une ressource d'une expédition (admin)
 */
export function createExpeditionResourceModifyModal(expeditionId: string, resourceTypeId: number, resourceName: string, currentQuantity: number) {
  const modal = new ModalBuilder()
    .setCustomId(`expedition_resource_modify_modal_${expeditionId}_${resourceTypeId}`)
    .setTitle(`Modifier ${resourceName}`);

  const quantityInput = new TextInputBuilder()
    .setCustomId("resource_quantity_input")
    .setLabel("Nouvelle quantité")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(currentQuantity.toString())
    .setPlaceholder(`Quantité actuelle: ${currentQuantity}`)
    .setMinLength(1)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);

  modal.addComponents([firstRow]);

  return modal;
}
