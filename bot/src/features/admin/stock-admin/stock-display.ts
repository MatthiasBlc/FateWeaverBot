import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createCustomEmbed, getStockColor, createInfoEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { checkAdmin } from "../../../utils/admin";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { getTownByGuildId } from "../../../utils/town";
import { getResourceEmoji } from "../../../services/emoji-cache";
import { STATUS } from "../../../constants/emojis.js";


/**
 * Handler principal pour la commande /stock-admin unifiée
 * Affiche directement les stocks avec boutons d'actions en dessous
 */
export async function handleStockAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn(
        "Utilisateur non admin tente d'utiliser la commande stock admin",
        {
          userId: interaction.user.id,
          guildId: interaction.guildId,
        }
      );
      return;
    }

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les ressources de la ville
    const resources = await apiService.getResources("CITY", town.id);

    // Créer l'embed avec les stocks
    const embed = createInfoEmbed(
      `🏛️ Ressources de ${town.name}`,
      "Vue complète des stocks de ressources de la ville"
    );

    // Ajouter chaque ressource avec son stock
    if (resources && resources.length > 0) {
      for (const resource of resources) {
        const resourceType = resource.resourceType;
        const quantity = resource.quantity;

        // Déterminer la couleur selon le niveau de stock
        let color = 0x00ff00; // Vert par défaut
        if (quantity < 10) color = 0xff0000; // Rouge si très faible
        else if (quantity < 50) color = 0xffa500; // Orange si faible
        else if (quantity < 100) color = 0xffff00; // Jaune si moyen

        const emoji = await getResourceEmoji(resourceType.name, resourceType.emoji);

        embed.addFields({
          name: `${emoji} ${resourceType.name}`,
          value: `**${quantity}** unités`,
          inline: true,
        });
      }
    } else {
      embed.addFields({
        name: "📦 Ressources",
        value: "Aucune ressource trouvée",
        inline: false,
      });
    }

    // Créer les boutons d'actions (seulement ajouter et retirer)
    const addButton = new ButtonBuilder()
      .setCustomId("stock_admin_add")
      .setLabel("➕ Ajouter")
      .setStyle(ButtonStyle.Success);

    const removeButton = new ButtonBuilder()
      .setCustomId("stock_admin_remove")
      .setLabel("➖ Retirer")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addButton,
      removeButton
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    });

    logger.info("Stock admin interface with stocks displayed", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      userId: interaction.user.id,
      resourcesCount: resources?.length || 0,
    });
  } catch (error) {
    logger.error("Error in stock admin command:", { error });
    await interaction.reply({
      content: ERROR_MESSAGES.ADMIN_STOCK_DISPLAY_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Voir les stocks"
 */
export async function handleStockAdminViewButton(interaction: any) {
  try {
    await interaction.deferUpdate();

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,
        embeds: [],
        components: [],
      });
      return;
    }

    // Récupérer les ressources de la ville
    const resources = await apiService.getResources("CITY", town.id);

    if (!resources || resources.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune ressource trouvée`,
        embeds: [],
        components: [],
      });
      return;
    }

    // Créer l'embed avec toutes les ressources
    const embed = createInfoEmbed(
      `🏛️ Ressources de ${town.name}`,
      "Vue complète des stocks de ressources de la ville"
    );

    // Ajouter chaque ressource avec son stock
    resources.forEach((resource: any) => {
      const resourceType = resource.resourceType;
      const quantity = resource.quantity;

      // Déterminer la couleur selon le niveau de stock
      let color = 0x00ff00; // Vert par défaut
      if (quantity < 10) color = 0xff0000; // Rouge si très faible
      else if (quantity < 50) color = 0xffa500; // Orange si faible
      else if (quantity < 100) color = 0xffff00; // Jaune si moyen

      embed.addFields({
        name: `${resourceType.emoji} ${resourceType.name}`,
        value: `**${quantity}** unités`,
        inline: true,
      });
    });

    await interaction.editReply({
      embeds: [embed],
      components: [],
    });

    logger.info("Stock admin view displayed via button", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error("Error in stock admin view button:", { error });
    await interaction.editReply({
      content: ERROR_MESSAGES.ADMIN_STOCK_FETCH_ERROR,
      embeds: [],
      components: [],
    });
  }
}
