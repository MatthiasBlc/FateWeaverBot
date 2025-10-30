/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { apiService } from "../../services/api";
import { emojiCache } from "../../services/emoji-cache";
import { logger } from "../../services/logger";
import { STATUS } from "../../constants/emojis";

/**
 * Valide si une chaîne est un emoji Discord valide
 */
function isValidEmoji(emoji: string): boolean {
  // Vérifier si c'est un emoji Unicode (simple regex pour les emojis de base)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  // Vérifier si c'est un emoji personnalisé Discord (<:name:id> ou <a:name:id>)
  const customEmojiRegex = /^<a?:\w+:\d+>$/;

  return emojiRegex.test(emoji) || customEmojiRegex.test(emoji);
}

/**
 * Gestionnaire principal pour la commande emoji-admin
 */
export async function handleEmojiAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "add":
      return handleEmojiAdd(interaction);
    case "list":
      return handleEmojiList(interaction);
    case "remove":
      return handleEmojiRemove(interaction);
    case "available":
      return handleEmojiAvailable(interaction);
    default:
      await interaction.reply({
        content: `${STATUS.ERROR} Sous-commande non reconnue.`,
        flags: ["Ephemeral"],
      });
  }
}

/**
 * Ajoute une nouvelle configuration d'emoji
 */
async function handleEmojiAdd(interaction: ChatInputCommandInteraction) {
  try {
    const type = interaction.options.getString("type", true);
    const key = interaction.options.getString("key", true);
    const emoji = interaction.options.getString("emoji", true);

    // Valider l'emoji
    if (!isValidEmoji(emoji)) {
      await interaction.reply({
        content: `${STATUS.ERROR} L'emoji fourni n'est pas valide. Utilisez un emoji Unicode ou un emoji Discord personnalisé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer l'emoji via l'API
    await apiService.emojis.createEmoji(type, key, emoji);

    // Rafraîchir le cache
    await emojiCache.refresh();

    await interaction.reply({
      content: `${STATUS.SUCCESS} Emoji ajouté avec succès !\n**Type:** ${type}\n**Clé:** ${key}\n**Emoji:** ${emoji}`,
      flags: ["Ephemeral"],
    });

    logger.info("Emoji added successfully", { type, key, emoji, userId: interaction.user.id });
  } catch (error: any) {
    logger.error("Error adding emoji:", { error });

    const errorMessage = error.response?.data?.message || error.message || "Erreur inconnue";

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout de l'emoji :\n${errorMessage}`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Liste tous les emojis (avec filtre optionnel)
 */
async function handleEmojiList(interaction: ChatInputCommandInteraction) {
  try {
    const type = interaction.options.getString("type");

    const emojis = await apiService.emojis.listEmojis(type || undefined);

    if (emojis.length === 0) {
      await interaction.reply({
        content: `${STATUS.INFO} Aucun emoji configuré${type ? ` pour le type **${type}**` : ""}.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Grouper par type
    const emojisByType: Record<string, Array<{ key: string; emoji: string }>> = {};

    for (const emoji of emojis) {
      if (!emojisByType[emoji.type]) {
        emojisByType[emoji.type] = [];
      }
      emojisByType[emoji.type].push({ key: emoji.key, emoji: emoji.emoji });
    }

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle("📋 Configuration des Emojis")
      .setColor(0x5865F2)
      .setTimestamp();

    if (type) {
      embed.setDescription(`Filtré par type : **${type}**`);
    }

    // Ajouter un champ par type
    for (const [typeName, emojiList] of Object.entries(emojisByType)) {
      const lines = emojiList.map(e => `${e.emoji} **${e.key}**`);

      // Discord limite les champs à 1024 caractères
      const fieldValue = lines.join("\n").substring(0, 1024);

      embed.addFields({
        name: `Type: ${typeName}`,
        value: fieldValue,
        inline: false,
      });
    }

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });

    logger.info("Emoji list displayed", { type, count: emojis.length, userId: interaction.user.id });
  } catch (error: any) {
    logger.error("Error listing emojis:", { error });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de la récupération de la liste des emojis.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Supprime une configuration d'emoji avec confirmation
 */
async function handleEmojiRemove(interaction: ChatInputCommandInteraction) {
  try {
    const type = interaction.options.getString("type", true);
    const key = interaction.options.getString("key", true);

    // Vérifier que l'emoji existe
    const emoji = emojiCache.getEmoji(type, key);

    if (emoji === "📦") {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucun emoji trouvé pour le type **${type}** et la clé **${key}**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if this is a resource emoji and query affected resources
    let affectedInfo = "";
    if (type === "resource") {
      try {
        const allResources = await apiService.resources.getAllResourceTypes();
        const affectedResources = allResources.filter((r: any) => r.name === key);

        if (affectedResources.length > 0) {
          affectedInfo = `\n\n⚠️ **${affectedResources.length} ressource(s) affectée(s)** afficheront le placeholder 📦 après suppression.`;
        }
      } catch (error) {
        logger.warn("Could not fetch affected resources", { error });
        affectedInfo = "\n\n⚠️ Les ressources utilisant cet emoji afficheront le placeholder 📦.";
      }
    }

    // Créer les boutons de confirmation
    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_emoji_${type}_${key}`)
      .setLabel(`${STATUS.SUCCESS} Confirmer`)
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId(`cancel_delete_emoji_${type}_${key}`)
      .setLabel(`${STATUS.ERROR} Annuler`)
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      cancelButton,
      confirmButton
    );

    await interaction.reply({
      content: `⚠️ **Confirmation de suppression**\n\nVous êtes sur le point de supprimer :\n**Type:** ${type}\n**Clé:** ${key}\n**Emoji:** ${emoji}${affectedInfo}`,
      components: [row],
      flags: ["Ephemeral"],
    });

    logger.info("Emoji removal confirmation displayed", { type, key, userId: interaction.user.id });
  } catch (error: any) {
    logger.error("Error preparing emoji removal:", { error });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de la préparation de la suppression.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Affiche les emojis disponibles (non encore utilisés)
 */
async function handleEmojiAvailable(interaction: ChatInputCommandInteraction) {
  try {
    const type = interaction.options.getString("type");

    const available = await apiService.emojis.getAvailableEmojis(type || undefined);

    if (Object.keys(available).length === 0) {
      await interaction.reply({
        content: `${STATUS.INFO} Aucun emoji disponible${type ? ` pour le type **${type}**` : ""}.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✨ Emojis Disponibles")
      .setColor(0x57F287)
      .setTimestamp();

    if (type) {
      embed.setDescription(`Filtré par type : **${type}**`);
    }

    const lines = Object.entries(available).map(([key, emoji]) => `${emoji} **${key}**`);
    const fieldValue = lines.join("\n").substring(0, 1024);

    embed.addFields({
      name: "Emojis non configurés",
      value: fieldValue,
      inline: false,
    });

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });

    logger.info("Available emojis displayed", { type, count: Object.keys(available).length, userId: interaction.user.id });
  } catch (error: any) {
    logger.error("Error fetching available emojis:", { error });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de la récupération des emojis disponibles.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la confirmation de suppression d'emoji (appelé par le button handler)
 */
export async function handleEmojiDeleteConfirmation(interaction: any) {
  try {
    const customId = interaction.customId;

    // Extraire type et key du customId
    const match = customId.match(/^confirm_delete_emoji_(.+)_(.+)$/);

    if (!match) {
      await interaction.update({
        content: `${STATUS.ERROR} Erreur lors de l'extraction des informations.`,
        components: [],
      });
      return;
    }

    const [, type, key] = match;

    // Supprimer l'emoji
    await apiService.emojis.deleteEmoji(type, key);

    // Rafraîchir le cache
    await emojiCache.refresh();

    await interaction.update({
      content: `${STATUS.SUCCESS} Emoji supprimé avec succès !\n**Type:** ${type}\n**Clé:** ${key}\n\n📦 Les ressources utilisant cet emoji afficheront maintenant le placeholder.`,
      components: [],
    });

    logger.info("Emoji deleted successfully", { type, key, userId: interaction.user.id });
  } catch (error: any) {
    logger.error("Error deleting emoji:", { error });

    await interaction.update({
      content: `${STATUS.ERROR} Erreur lors de la suppression de l'emoji.`,
      components: [],
    });
  }
}

/**
 * Gère l'annulation de suppression d'emoji
 */
export async function handleEmojiDeleteCancellation(interaction: any) {
  await interaction.update({
    content: `${STATUS.INFO} Suppression annulée.`,
    components: [],
  });

  logger.info("Emoji deletion cancelled", { userId: interaction.user.id });
}
