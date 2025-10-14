import { type ChatInputCommandInteraction } from "discord.js";
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

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "capability") {
      await handleAddCapability(interaction);
    } else if (subcommand === "resource") {
      await handleAddResource(interaction);
    }
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
 * Ajoute une nouvelle capacité
 */
async function handleAddCapability(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name", true);
  const emojiTag = interaction.options.getString("emoji_tag", true);
  const category = interaction.options.getString("category", true) as
    | "HARVEST"
    | "CRAFT"
    | "SCIENCE"
    | "SPECIAL";
  const costPA = interaction.options.getInteger("cost_pa", true);
  const description = interaction.options.getString("description");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API backend pour créer la capacité
    const response = await apiService.capabilities.createCapability({
      name,
      emojiTag,
      category,
      costPA,
      description: description || undefined,
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
 * Ajoute un nouveau type de ressource
 */
async function handleAddResource(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name", true);
  const emoji = interaction.options.getString("emoji", true);
  const category = interaction.options.getString("category", true);
  const description = interaction.options.getString("description");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API backend pour créer le type de ressource
    const response = await apiService.resources.createResourceType({
      name,
      emoji,
      category,
      description: description || undefined,
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
