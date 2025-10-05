import { logger } from "../services/logger.js";

/**
 * Gestionnaire centralisé des interactions de modals
 */
export class ModalHandler {
  private static instance: ModalHandler;
  private handlers: Map<string, (interaction: any) => Promise<void>> =
    new Map();

  private constructor() {
    this.registerDefaultHandlers();
  }

  public static getInstance(): ModalHandler {
    if (!ModalHandler.instance) {
      ModalHandler.instance = new ModalHandler();
    }
    return ModalHandler.instance;
  }

  /**
   * Enregistre un gestionnaire pour un modal spécifique
   */
  public registerHandler(
    modalId: string,
    handler: (interaction: any) => Promise<void>
  ) {
    this.handlers.set(modalId, handler);
    logger.info(`Registered modal handler for: ${modalId}`);
  }

  /**
   * Enregistre les gestionnaires par défaut
   */
  private registerDefaultHandlers() {
    // Gestionnaire pour les modals d'ajout de foodstock
    this.registerHandler("food_modal", async (interaction) => {
      try {
        const { handleAddFoodModal } = await import(
          "../features/admin/food-admin.handlers.js"
        );
        await handleAddFoodModal(interaction);
      } catch (error) {
        logger.error("Error handling food modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              "❌ Erreur lors du traitement du formulaire d'ajout de foodstock.",
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.followUp({
            content:
              "❌ Erreur lors du traitement du formulaire d'ajout de foodstock.",
            ephemeral: true,
          });
        }
      }
    });

    // Gestionnaire pour les modals de retrait de foodstock
    this.registerHandler("remove_food_modal", async (interaction) => {
      try {
        const { handleRemoveFoodModal } = await import(
          "../features/admin/food-admin.handlers.js"
        );
        await handleRemoveFoodModal(interaction);
      } catch (error) {
        logger.error("Error handling remove food modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              "❌ Erreur lors du traitement du formulaire de retrait de foodstock.",
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.followUp({
            content:
              "❌ Erreur lors du traitement du formulaire de retrait de foodstock.",
            ephemeral: true,
          });
        }
      }
    });

    // Gestionnaire pour les modals de création de personnage
    this.registerHandler("character_creation_modal", async (interaction) => {
      try {
        const { handleCharacterCreation } = await import(
          "../modals/character-modals.js"
        );
        await handleCharacterCreation(interaction);
      } catch (error) {
        logger.error("Error handling character creation modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la création du personnage.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals de reroll
    this.registerHandler("reroll_modal", async (interaction) => {
      try {
        const { handleReroll } = await import("../modals/character-modals.js");
        await handleReroll(interaction);
      } catch (error) {
        logger.error("Error handling reroll modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du reroll du personnage.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals d'administration de personnages (stats avancées)
    this.registerHandler(
      "character_admin_advanced_modal_",
      async (interaction) => {
        try {
          const { handleAdvancedStatsModalSubmit } = await import(
            "../features/admin/character-admin.interactions"
          );
          await handleAdvancedStatsModalSubmit(interaction);
        } catch (error) {
          logger.error("Error handling character admin advanced stats modal:", {
            error,
          });
          if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === 10062
          ) {
            return; // Interaction expirée
          }
          await interaction.reply({
            content:
              "❌ Erreur lors de la modification des statistiques avancées du personnage.",
            flags: ["Ephemeral"],
          });
        }
      }
    );

    // Gestionnaire pour les modals de création d'expédition
    this.registerHandler("expedition_creation_modal", async (interaction) => {
      try {
        const { handleExpeditionCreationModal } = await import(
          "../features/expeditions/expedition.handlers.js"
        );
        await handleExpeditionCreationModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition creation modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la création de l'expédition.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals de modification d'expédition
    this.registerHandler("expedition_modify_modal", async (interaction) => {
      try {
        const { handleExpeditionModifyModal } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionModifyModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition modify modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la modification de l'expédition.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals de transfert d'expédition (nouveau format avec direction)
    this.registerHandler("expedition_transfer_amount_modal_", async (interaction) => {
      try {
        const { handleExpeditionTransferModal } = await import(
          "../features/expeditions/expedition.handlers.js"
        );
        await handleExpeditionTransferModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition transfer amount modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du transfert de nourriture.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals d'investissement dans les chantiers
    this.registerHandler("invest_modal", async (interaction) => {
      try {
        const { handleInvestModalSubmit } = await import(
          "../features/chantiers/chantiers.handlers.js"
        );
        await handleInvestModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling invest modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              "❌ Erreur lors du traitement du formulaire d'investissement.",
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.followUp({
            content:
              "❌ Erreur lors du traitement du formulaire d'investissement.",
            ephemeral: true,
          });
        }
      }
    });
  }

  /**
   * Traite une interaction de modal
   */
  public async handleModal(interaction: any): Promise<boolean> {
    const { customId } = interaction;

    logger.info(`Modal interaction received: ${customId}`);

    // Essayer d'abord avec l'ID exact
    let handler = this.handlers.get(customId);

    // Si aucun gestionnaire trouvé et que l'ID commence par un préfixe connu, essayer avec le préfixe
    if (!handler) {
      for (const [prefix, registeredHandler] of this.handlers.entries()) {
        if (customId.startsWith(prefix)) {
          handler = registeredHandler;
          break;
        }
      }
    }

    if (handler) {
      await handler(interaction);
      return true;
    }

    // Aucun gestionnaire trouvé
    await interaction.reply({
      content: `Modal non reconnu: ${customId}`,
      flags: ["Ephemeral"],
    });
    return false;
  }

  /**
   * Liste tous les modals enregistrés (pour le debug)
   */
  public listRegisteredModals(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Export d'une instance singleton
export const modalHandler = ModalHandler.getInstance();
