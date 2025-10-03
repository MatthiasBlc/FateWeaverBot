import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

/**
 * Modal pour créer une nouvelle expédition
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
    .setPlaceholder("Entrez le nom de votre expédition")
    .setMinLength(1)
    .setMaxLength(100);

  const foodInput = new TextInputBuilder()
    .setCustomId("expedition_food_input")
    .setLabel("Stock de nourriture à emporter")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Quantité de nourriture (ex: 50)")
    .setMinLength(1)
    .setMaxLength(10);

  const durationInput = new TextInputBuilder()
    .setCustomId("expedition_duration_input")
    .setLabel("Durée de l'expédition (heures)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Durée en heures (ex: 24)")
    .setMinLength(1)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(foodInput);
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput);

  modal.addComponents([firstRow, secondRow, thirdRow]);

  return modal;
}
