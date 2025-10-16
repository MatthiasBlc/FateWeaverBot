import {
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
import { STATUS } from "../../constants/emojis";

/**
 * Gère la commande /new-element-admin
 */
export async function handleNewElementAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous devez être administrateur pour utiliser cette commande.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer les boutons
    const capabilityButton = new ButtonBuilder()
      .setCustomId("new_element_capability")
      .setLabel("➕ Nouvelle Capacité")
      .setStyle(ButtonStyle.Primary);

    const resourceButton = new ButtonBuilder()
      .setCustomId("new_element_resource")
      .setLabel("➕ Nouvelle Ressource")
      .setStyle(ButtonStyle.Success);

    const objectButton = new ButtonBuilder()
      .setCustomId("new_element_object")
      .setLabel("➕ Nouvel Objet")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      capabilityButton,
      resourceButton,
      objectButton
    );

    await interaction.reply({
      content: "**Que souhaitez-vous créer ?**",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleNewElementAdminCommand", {
      error: error instanceof Error ? error.message : error,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère le clic sur le bouton "Nouvelle Capacité"
 */
export async function handleNewCapabilityButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour la capacité
    const modal = new ModalBuilder()
      .setCustomId("new_capability_modal")
      .setTitle("Créer une nouvelle capacité");

    const nameInput = new TextInputBuilder()
      .setCustomId("capability_name")
      .setLabel("Nom de la capacité")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiTagInput = new TextInputBuilder()
      .setCustomId("capability_emoji_tag")
      .setLabel("Tag emoji (ex: HUNT, GATHER)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const categoryInput = new TextInputBuilder()
      .setCustomId("capability_category")
      .setLabel("Catégorie (HARVEST/CRAFT/SCIENCE/SPECIAL)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const costPAInput = new TextInputBuilder()
      .setCustomId("capability_cost_pa")
      .setLabel("Coût en PA (1-4)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(1);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("capability_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiTagInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(costPAInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewCapabilityButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère le clic sur le bouton "Nouvelle Ressource"
 */
export async function handleNewResourceButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour la ressource
    const modal = new ModalBuilder()
      .setCustomId("new_resource_modal")
      .setTitle("Créer un nouveau type de ressource");

    const nameInput = new TextInputBuilder()
      .setCustomId("resource_name")
      .setLabel("Nom de la ressource")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiInput = new TextInputBuilder()
      .setCustomId("resource_emoji")
      .setLabel("Emoji de la ressource (ex: 🌲)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    const categoryInput = new TextInputBuilder()
      .setCustomId("resource_category")
      .setLabel("Catégorie (base/transformé/science)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("resource_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewResourceButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de capacité
 */
export async function handleCapabilityModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("capability_name");
  const emojiTag = interaction.fields.getTextInputValue("capability_emoji_tag");
  const categoryRaw = interaction.fields.getTextInputValue("capability_category").toUpperCase();
  const costPARaw = interaction.fields.getTextInputValue("capability_cost_pa");
  const description = interaction.fields.getTextInputValue("capability_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Valider la catégorie
    const validCategories = ["HARVEST", "CRAFT", "SCIENCE", "SPECIAL"];
    if (!validCategories.includes(categoryRaw)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : HARVEST, CRAFT, SCIENCE ou SPECIAL.`,
      });
      return;
    }
    const category = categoryRaw as "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";

    // Valider le coût PA
    const costPA = parseInt(costPARaw, 10);
    if (isNaN(costPA) || costPA < 1 || costPA > 4) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Coût PA invalide. Utilisez un nombre entre 1 et 4.`,
      });
      return;
    }

    // Appeler l'API backend pour créer la capacité
    const response = await apiService.capabilities.createCapability({
      name,
      emojiTag,
      category,
      costPA,
      description,
    });

    logger.info("Nouvelle capacité créée", {
      name,
      emojiTag,
      category,
      costPA,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité créée avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Tag emoji** : ${emojiTag}\n` +
        `**Catégorie** : ${category}\n` +
        `**Coût PA** : ${costPA}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création de la capacité", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}

/**
 * Gère la soumission du modal de ressource
 */
export async function handleResourceModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("resource_name");
  const emoji = interaction.fields.getTextInputValue("resource_emoji");
  const category = interaction.fields.getTextInputValue("resource_category");
  const description = interaction.fields.getTextInputValue("resource_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Valider la catégorie
    const validCategories = ["base", "transformé", "science"];
    if (!validCategories.includes(category)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : base, transformé ou science.`,
      });
      return;
    }

    // Appeler l'API backend pour créer le type de ressource
    const response = await apiService.resources.createResourceType({
      name,
      emoji,
      category,
      description,
    });

    logger.info("Nouveau type de ressource créé", {
      name,
      emoji,
      category,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Type de ressource créé avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Emoji** : ${emoji}\n` +
        `**Catégorie** : ${category}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création du type de ressource", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}

/**
 * Gère le clic sur le bouton "Nouvel Objet"
 */
export async function handleNewObjectButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour l'objet
    const modal = new ModalBuilder()
      .setCustomId("new_object_modal")
      .setTitle("Créer un nouvel objet");

    const nameInput = new TextInputBuilder()
      .setCustomId("object_name")
      .setLabel("Nom de l'objet")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("object_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewObjectButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal d'objet
 */
export async function handleObjectModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("object_name");
  const description = interaction.fields.getTextInputValue("object_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API backend pour créer l'objet
    const response = await apiService.objects.createObjectType({
      name,
      description,
    });

    logger.info("Nouvel objet créé", {
      name,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Objet créé avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création de l'objet", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}
