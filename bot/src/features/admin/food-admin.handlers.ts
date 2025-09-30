import { 
  CommandInteraction, 
  ChatInputCommandInteraction,
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  ModalSubmitInteraction
} from "discord.js";
import { apiService } from "@/services/api";
import { logger } from "@/services/logger";
import { getTownByGuildId } from "@/utils/town";
import { formatDate } from "@/utils/date";
import { checkAdmin } from "@/utils/admin";
import { Town } from "@/types";

function createRemoveFoodModal() {
  const modal = new ModalBuilder()
    .setCustomId('remove_food_modal')
    .setTitle('Retirer du foodstock');

  const amountInput = new TextInputBuilder()
    .setCustomId('amount_input')
    .setLabel('Quantité à retirer')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
  modal.addComponents(firstActionRow);
  
  return modal;
}

export async function handleRemoveFoodCommand(
  interaction: CommandInteraction | ChatInputCommandInteraction
) {
  try {
    logger.info("Début de handleRemoveFoodCommand", {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn("Utilisateur non admin tente d'utiliser la commande", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });
      return;
    }

    logger.info("Utilisateur vérifié comme admin", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || '');
    if (!town) {
      logger.warn("Aucune ville trouvée pour le serveur", {
        guildId: interaction.guildId,
      });
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        ephemeral: true,
      });
      return;
    }

    // Créer et afficher le modal de retrait
    const modal = createRemoveFoodModal();
    await interaction.showModal(modal);

    // Gérer la soumission du modal
    const modalFilter = (i: ModalSubmitInteraction) =>
      i.customId === "remove_food_modal" && i.user.id === interaction.user.id;

    try {
      const modalResponse = await interaction.awaitModalSubmit({
        filter: modalFilter,
        time: 300000, // 5 minutes pour répondre
      }) as ModalSubmitInteraction;

      const amount = parseInt(
        modalResponse.fields.getTextInputValue("amount_input"),
        10
      );

      if (isNaN(amount) || amount <= 0) {
        await modalResponse.reply({
          content: "❌ Veuillez entrer un nombre valide (supérieur à 0).",
          ephemeral: true,
        });
        return;
      }

      if (town.foodStock < amount) {
        await modalResponse.reply({
          content: `❌ La ville n'a que **${town.foodStock}** foodstock. Vous ne pouvez pas en retirer **${amount}**.`,
          ephemeral: true,
        });
        return;
      }

      // Mettre à jour le stock de foodstock
      const updatedTown = await apiService.updateTownFoodStock(
        town.id,
        town.foodStock - amount
      ) as Town;

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Foodstock Retiré")
        .setDescription(`**${amount}** foodstock ont été retirés de la ville **${town.name}**.`)
        .addFields(
          { name: "Ancien stock", value: `${town.foodStock}`, inline: true },
          { name: "Montant retiré", value: `-${amount}`, inline: true },
          { name: "Nouveau stock", value: `${updatedTown.foodStock}`, inline: true }
        )
        .setTimestamp();

      await modalResponse.reply({ embeds: [embed] });

    } catch (error) {
      if (error instanceof Error) {
        logger.error("Erreur lors de la soumission du modal", {
          error: error.message,
          stack: error.stack,
        });
      }
      // Ne rien faire si l'utilisateur n'a pas répondu au modal
    }

  } catch (error) {
    logger.error("Erreur dans handleRemoveFoodCommand", {
      error: error instanceof Error ? error.message : error,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });
    
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors du retrait du foodstock.",
        ephemeral: true,
      });
    }
  }
}

export async function handleAddFoodCommand(
  interaction: CommandInteraction | ChatInputCommandInteraction
) {
  try {
    logger.info("Début de handleAddFoodCommand", {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn("Utilisateur non admin tente d'utiliser la commande", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });
      return;
    }

    logger.info("Utilisateur vérifié comme admin", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Récupérer la ville du serveur
    logger.info("Récupération de la ville pour le serveur", {
      guildId: interaction.guildId,
    });
    
    const town = await getTownByGuildId(interaction.guildId || '');

    if (!town) {
      logger.warn("Aucune ville trouvée pour le serveur", {
        guildId: interaction.guildId,
      });
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        ephemeral: true,
      });
      return;
    }

    logger.info("Ville récupérée avec succès", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      currentFoodStock: town.foodStock,
    });

    // Créer un modal pour demander la quantité de foodstock à retirer
    logger.info("Création du modal pour le retrait de foodstock");
    const modal = createRemoveFoodModal();

    logger.info("Affichage du modal à l'utilisateur");
    await interaction.showModal(modal);

    // Gérer la soumission du modal
    const modalFilter = (i: ModalSubmitInteraction) =>
      i.customId === "remove_food_modal" && i.user.id === interaction.user.id;

    try {
      const modalResponse = await interaction.awaitModalSubmit({
        filter: modalFilter,
        time: 300000, // 5 minutes pour répondre
      }) as ModalSubmitInteraction;

      const amount = parseInt(
        modalResponse.fields.getTextInputValue("amount_input"),
        10
      );

      if (isNaN(amount) || amount <= 0) {
        await modalResponse.reply({
          content:
            "❌ Veuillez entrer un nombre valide de foodstock (supérieur à 0).",
          flags: ["Ephemeral"],
        });
        return;
      }

      if (town.foodStock < amount) {
        await modalResponse.reply({
          content: `❌ La ville n'a que **${town.foodStock}** foodstock. Vous ne pouvez pas en retirer **${amount}**.`,
          flags: ["Ephemeral"],
        });
      }

      // Mettre à jour le stock de foodstock
      const updatedTown = (await apiService.updateTownFoodStock(
        town.id,
        town.foodStock + amount
      )) as Town;

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
      logger.error(
        "Erreur lors de la soumission du modal de retrait de foodstock:",
        { error }
      );
      if (!interaction.replied) {
        await interaction.followUp({
          content: "❌ Temps écoulé ou erreur lors de la saisie.",
          flags: ["Ephemeral"],
        });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la préparation du retrait de foodstock:", {
      error,
    });
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de la préparation de la commande.",
      flags: ["Ephemeral"],
    });
  }
}

function createFoodModal() {
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

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
  modal.addComponents([firstActionRow]);

  return modal;
}

function getFoodStockColor(stock: number): number {
  if (stock > 100) return 0x00ff00; // Vert - stock élevé
  if (stock > 50) return 0xffff00; // Jaune - stock moyen
  if (stock > 20) return 0xffa500; // Orange - stock faible
  return 0xff0000; // Rouge - stock critique
}
