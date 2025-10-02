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

    logger.info("Ville récupérée avec succès", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      currentFoodStock: town.foodStock,
    });

    // Créer et afficher le modal de retrait
    logger.info("Création du modal pour le retrait de foodstock");
    const modal = createRemoveFoodModal();
    
    try {
      logger.info("Affichage du modal de retrait à l'utilisateur");
      await interaction.showModal(modal);
      
      // Ne pas attendre la réponse ici, elle sera gérée par le modalHandler
      await interaction.reply({
        content: "Veuillez remplir le formulaire qui vient de s'ouvrir.",
        ephemeral: true
      });
      
    } catch (error) {
      logger.error("Erreur lors de l'affichage du modal de retrait de foodstock:", {
        error: error instanceof Error ? error.message : error,
      });
      
      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Une erreur est survenue lors de l'ouverture du formulaire.",
          ephemeral: true
        });
      }
    }
  } catch (error) {
    logger.error("Erreur dans handleRemoveFoodCommand", {
      error: error instanceof Error ? error.message : error,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });
    
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de la préparation de la commande.",
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

    // Créer et afficher le modal d'ajout
    logger.info("Création du modal pour l'ajout de foodstock");
    const modal = createFoodModal();
    
    try {
      logger.info("Affichage du modal d'ajout à l'utilisateur");
      await interaction.showModal(modal);
      
      // Ne pas attendre la réponse ici, elle sera gérée par le modalHandler
      await interaction.reply({
        content: "Veuillez remplir le formulaire qui vient de s'ouvrir.",
        ephemeral: true
      });
      
    } catch (error) {
      logger.error("Erreur lors de l'affichage du modal d'ajout de foodstock:", {
        error: error instanceof Error ? error.message : error,
      });
      
      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Une erreur est survenue lors de l'ouverture du formulaire.",
          ephemeral: true
        });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la préparation de l'ajout de foodstock:", {
      error: error instanceof Error ? error.message : error,
    });
    
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de la préparation de la commande.",
        ephemeral: true
      });
    }
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
  modal.addComponents(firstActionRow);

  return modal;
}

// Gère la soumission du modal d'ajout de foodstock
export async function handleAddFoodModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const amount = parseInt(
      interaction.fields.getTextInputValue("amount_input"),
      10
    );

    logger.info(`Quantité de foodstock à ajouter: ${amount}`);

    if (isNaN(amount) || amount <= 0) {
      logger.warn("Montant invalide saisi par l'utilisateur", { amount });
      await interaction.editReply({
        content: "❌ Veuillez entrer un nombre valide (supérieur à 0)."
      });
      return;
    }

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || '');
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur."
      });
      return;
    }

    // Mettre à jour le stock de foodstock
    logger.info("Mise à jour du stock de foodstock", {
      townId: town.id,
      currentStock: town.foodStock,
      amountToAdd: amount,
      newStock: town.foodStock + amount
    });
    
    const updatedTown = await apiService.updateTownFoodStock(
      town.id,
      town.foodStock + amount
    ) as Town;

    // Créer l'embed de confirmation
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Foodstock Ajoutés")
      .setDescription(`**${amount}** foodstock ont été ajoutés à la ville **${town.name}**.`)
      .addFields(
        { name: "Ancien stock", value: `${town.foodStock}`, inline: true },
        { name: "Montant ajouté", value: `+${amount}`, inline: true },
        { name: "Nouveau stock", value: `${updatedTown.foodStock}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ 
      content: "",
      embeds: [embed],
      components: []
    });

  } catch (error) {
    logger.error("Erreur dans handleAddFoodModal:", { error });
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de l'ajout du foodstock.",
        ephemeral: true
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: "❌ Une erreur est survenue lors de l'ajout du foodstock."
      });
    }
  }
}

// Gère la soumission du modal de retrait de foodstock
export async function handleRemoveFoodModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const amount = parseInt(
      interaction.fields.getTextInputValue("amount_input"),
      10
    );

    logger.info(`Quantité de foodstock à retirer: ${amount}`);

    if (isNaN(amount) || amount <= 0) {
      logger.warn("Montant invalide saisi par l'utilisateur", { amount });
      await interaction.editReply({
        content: "❌ Veuillez entrer un nombre valide (supérieur à 0)."
      });
      return;
    }

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || '');
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur."
      });
      return;
    }

    if (town.foodStock < amount) {
      logger.warn("Tentative de retrait d'un montant supérieur au stock disponible", {
        requested: amount,
        available: town.foodStock
      });
      await interaction.editReply({
        content: `❌ La ville n'a que **${town.foodStock}** foodstock. Vous ne pouvez pas en retirer **${amount}**.`
      });
      return;
    }

    // Mettre à jour le stock de foodstock
    logger.info("Mise à jour du stock de foodstock", {
      townId: town.id,
      currentStock: town.foodStock,
      amountToRemove: amount,
      newStock: town.foodStock - amount
    });
    
    const updatedTown = await apiService.updateTownFoodStock(
      town.id,
      town.foodStock - amount
    ) as Town;

    // Créer l'embed de confirmation
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Foodstock Retirés")
      .setDescription(`**${amount}** foodstock ont été retirés de la ville **${town.name}**.`)
      .addFields(
        { name: "Ancien stock", value: `${town.foodStock}`, inline: true },
        { name: "Montant retiré", value: `-${amount}`, inline: true },
        { name: "Nouveau stock", value: `${updatedTown.foodStock}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ 
      content: "",
      embeds: [embed],
      components: []
    });

  } catch (error) {
    logger.error("Erreur dans handleRemoveFoodModal:", { error });
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors du retrait du foodstock.",
        ephemeral: true
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: "❌ Une erreur est survenue lors du retrait du foodstock."
      });
    }
  }
}

function getFoodStockColor(stock: number): number {
  if (stock > 100) return 0x00ff00; // Vert - stock élevé
  if (stock > 50) return 0xffff00; // Jaune - stock moyen
  if (stock > 20) return 0xffa500; // Orange - stock faible
  return 0xff0000; // Rouge - stock critique
}
