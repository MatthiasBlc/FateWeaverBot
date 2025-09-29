import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";

export async function handleAddFoodCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer un modal pour demander la quantité de foodstock à ajouter
    const modal = createFoodModal();

    await interaction.showModal(modal);

    // Gérer la soumission du modal
    const modalFilter = (i: any) => i.customId === "food_modal" && i.user.id === interaction.user.id;

    try {
      const modalResponse = await interaction.awaitModalSubmit({
        filter: modalFilter,
        time: 300000, // 5 minutes pour répondre
      });

      const amount = parseInt(modalResponse.fields.getTextInputValue("amount_input"), 10);

      if (isNaN(amount) || amount <= 0) {
        await modalResponse.reply({
          content: "❌ Veuillez entrer un nombre valide de foodstock (supérieur à 0).",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Mettre à jour le stock de foodstock
      const updatedTown = await apiService.updateTownFoodStock(town.id, town.foodStock + amount);

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Foodstock Ajoutés")
        .setDescription(`**${amount}** foodstock ont été ajoutés à la ville **${town.name}**.`)
        .addFields(
          {
            name: "Stock précédent",
            value: `${town.foodStock}`,
            inline: true,
          },
          {
            name: "Quantité ajoutée",
            value: `+${amount}`,
            inline: true,
          },
          {
            name: "Nouveau stock",
            value: `${updatedTown.foodStock}`,
            inline: true,
          }
        )
        .setTimestamp();

      await modalResponse.reply({ embeds: [embed] });

    } catch (error) {
      logger.error("Erreur lors de la soumission du modal de vivres:", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "❌ Temps écoulé ou erreur lors de la saisie.",
          flags: ["Ephemeral"],
        });
      }
    }

  } catch (error) {
    logger.error("Erreur lors de la préparation de l'ajout de vivres:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la préparation de la commande.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleViewFoodCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer l'embed d'information
    const embed = new EmbedBuilder()
      .setColor(getFoodStockColor(town.foodStock))
      .setTitle(`🏪 Stock de Foodstock - ${town.name}`)
      .setDescription(`La ville dispose actuellement de **${town.foodStock}** foodstock.`)
      .addFields(
        {
          name: "📊 Stock Actuel",
          value: `${town.foodStock}`,
          inline: true,
        },
        {
          name: "🏘️ Ville",
          value: town.name,
          inline: true,
        },
        {
          name: "🆔 ID Serveur",
          value: town.guild.discordGuildId,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });

  } catch (error: any) {
    logger.error("Erreur lors de la récupération du stock de foodstock:", {
      guildId: interaction.guildId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    let errorMessage = "❌ Une erreur est survenue lors de la récupération du stock de foodstock.";

    if (error.response?.status === 404) {
      errorMessage = "❌ Aucune ville trouvée pour ce serveur. Contactez un administrateur.";
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      errorMessage = "❌ Problème d'autorisation. Contactez un administrateur.";
    }

    await interaction.reply({
      content: errorMessage,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleRemoveFoodCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer un modal pour demander la quantité de foodstock à retirer
    const modal = createRemoveFoodModal();

    await interaction.showModal(modal);

    // Gérer la soumission du modal
    const modalFilter = (i: any) => i.customId === "remove_food_modal" && i.user.id === interaction.user.id;

    try {
      const modalResponse = await interaction.awaitModalSubmit({
        filter: modalFilter,
        time: 300000, // 5 minutes pour répondre
      });

      const amount = parseInt(modalResponse.fields.getTextInputValue("amount_input"), 10);

      if (isNaN(amount) || amount <= 0) {
        await modalResponse.reply({
          content: "❌ Veuillez entrer un nombre valide de foodstock (supérieur à 0).",
          flags: ["Ephemeral"],
        });
        return;
      }

      if (town.foodStock < amount) {
        await modalResponse.reply({
          content: `❌ La ville n'a que **${town.foodStock}** foodstock. Vous ne pouvez pas en retirer **${amount}**.`,
          flags: ["Ephemeral"],
        });
        return;
      }

      // Mettre à jour le stock de foodstock
      const updatedTown = await apiService.updateTownFoodStock(town.id, town.foodStock - amount);

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("✅ Foodstock Retirés")
        .setDescription(`**${amount}** foodstock ont été retirés de la ville **${town.name}**.`)
        .addFields(
          {
            name: "Stock précédent",
            value: `${town.foodStock}`,
            inline: true,
          },
          {
            name: "Quantité retirée",
            value: `-${amount}`,
            inline: true,
          },
          {
            name: "Nouveau stock",
            value: `${updatedTown.foodStock}`,
            inline: true,
          }
        )
        .setTimestamp();

      await modalResponse.reply({ embeds: [embed] });

    } catch (error) {
      logger.error("Erreur lors de la soumission du modal de retrait de foodstock:", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "❌ Temps écoulé ou erreur lors de la saisie.",
          flags: ["Ephemeral"],
        });
      }
    }

  } catch (error) {
    logger.error("Erreur lors de la préparation du retrait de foodstock:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la préparation de la commande.",
      flags: ["Ephemeral"],
    });
  }
}

function createRemoveFoodModal() {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

  const modal = new ModalBuilder()
    .setCustomId("remove_food_modal")
    .setTitle("Retirer des Foodstock");

  const amountInput = new TextInputBuilder()
    .setCustomId("amount_input")
    .setLabel("Quantité de foodstock à retirer")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez un nombre (ex: 50)")
    .setMinLength(1)
    .setMaxLength(4);

  const firstActionRow = new ActionRowBuilder().addComponents([amountInput]);
  modal.addComponents(firstActionRow);

  return modal;
}

function createFoodModal() {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

  const modal = new ModalBuilder()
    .setCustomId("food_modal")
    .setTitle("Ajouter des Foodstock");

  const amountInput = new TextInputBuilder()
    .setCustomId("amount_input")
    .setLabel("Quantité de foodstock à ajouter")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez un nombre (ex: 100)")
    .setMinLength(1)
    .setMaxLength(4);

  const firstActionRow = new ActionRowBuilder().addComponents([amountInput]);
  modal.addComponents(firstActionRow);

  return modal;
}

function getFoodStockColor(stock: number): number {
  if (stock > 100) return 0x00ff00; // Vert - stock élevé
  if (stock > 50) return 0xffff00;  // Jaune - stock moyen
  if (stock > 20) return 0xffa500;  // Orange - stock faible
  return 0xff0000; // Rouge - stock critique
}
