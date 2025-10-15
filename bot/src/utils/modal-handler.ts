import { logger } from "../services/logger.js";

/**
 * Gestionnaire centralisé des interactions de modals
 *
 * ⚠️ CONSIGNES DE SÉCURITÉ CRITIQUES :
 *
 * 1. NE PAS SUPPRIMER les handlers existants
 * 2. NE PAS MODIFIER les handlers existants
 * 3. AJOUTER seulement APRÈS le commentaire "NOUVEAUX HANDLERS"
 * 4. Respecter le format : this.registerHandler("nom_du_modal", handler)
 * 5. Tester immédiatement après ajout
 *
 * 📋 MODALS EXISTANTS (NE PAS TOUCHER) :
 * - character_creation_modal : création personnage
 * - reroll_modal : reroll personnage
 * - character_admin_advanced_modal_ : admin personnages avancées
 * - expedition_creation_modal : création expédition
 * - expedition_modify_modal : modification expédition
 * - expedition_transfer_amount_modal_ : transfert expédition
 * - invest_modal : investissement chantiers
 * - stock_admin_add_modal_ : ajout ressources admin
 * - stock_admin_remove_modal_ : retrait ressources admin
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
   *
   * ⚠️ ZONE D'AJOUT SÉCURISÉE :
   * Ajouter les nouveaux handlers APRÈS le commentaire "NOUVEAUX HANDLERS"
   * et AVANT la fermeture de la fonction }
   */
  private registerDefaultHandlers() {
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
            "../features/admin/character-admin/character-stats.js"
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
          "../features/expeditions/expedition.command.js"
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
    this.registerHandler(
      "expedition_transfer_amount_modal_",
      async (interaction) => {
        try {
          const { handleExpeditionTransferModal } = await import(
            "../features/expeditions/expedition.command.js"
          );
          await handleExpeditionTransferModal(interaction);
        } catch (error) {
          logger.error("Error handling expedition transfer amount modal:", {
            error,
          });
          await interaction.reply({
            content: "❌ Erreur lors du transfert de nourriture.",
            flags: ["Ephemeral"],
          });
        }
      }
    );

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

    // Gestionnaire pour les modals d'ajout de stock admin
    this.registerHandler("stock_admin_add_modal_", async (interaction) => {
      try {
        const { handleStockAdminAddModal } = await import(
          "../features/admin/stock-admin/stock-add.js"
        );
        await handleStockAdminAddModal(interaction);
      } catch (error) {
        logger.error("Error handling stock admin add modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              "❌ Erreur lors du traitement du formulaire d'ajout de ressources.",
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content:
              "❌ Erreur lors du traitement du formulaire d'ajout de ressources.",
          });
        }
      }
    });

    // Gestionnaire pour les modals de retrait de stock admin
    this.registerHandler("stock_admin_remove_modal_", async (interaction) => {
      try {
        const { handleStockAdminRemoveModal } = await import(
          "../features/admin/stock-admin/stock-remove.js"
        );
        await handleStockAdminRemoveModal(interaction);
      } catch (error) {
        logger.error("Error handling stock admin remove modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              "❌ Erreur lors du traitement du formulaire de retrait de ressources.",
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content:
              "❌ Erreur lors du traitement du formulaire de retrait de ressources.",
          });
        }
      }
    });

    // =================== NOUVEAUX HANDLERS ===================
    // ⚠️ AJOUTER LES NOUVEAUX HANDLERS CI-DESSOUS SEULEMENT
    // Ne pas modifier les handlers existants au-dessus de cette ligne
    // ========================================================

    // Gestionnaire pour le modal de création de chantier
    this.registerHandler("chantier_create_modal", async (interaction) => {
      try {
        const { handleChantierCreateModal } = await import(
          "../features/chantiers/chantier-creation.js"
        );
        await handleChantierCreateModal(interaction);
      } catch (error) {
        logger.error("Error handling chantier create modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la création du chantier.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de quantité de ressource pour chantier
    this.registerHandler(
      "chantier_resource_quantity_",
      async (interaction) => {
        try {
          const { handleResourceQuantityModal } = await import(
            "../features/chantiers/chantier-creation.js"
          );
          await handleResourceQuantityModal(interaction);
        } catch (error) {
          logger.error("Error handling chantier resource quantity modal:", {
            error,
          });
          await interaction.reply({
            content: "❌ Erreur lors de l'ajout de la ressource.",
            flags: ["Ephemeral"],
          });
        }
      }
    );

    // =================== PROJECTS HANDLERS ===================
    // Gestionnaire pour le modal de création de projet
    this.registerHandler("project_create_modal", async (interaction) => {
      try {
        const { handleProjectCreateModal } = await import(
          "../features/projects/project-creation.js"
        );
        await handleProjectCreateModal(interaction);
      } catch (error) {
        logger.error("Error handling project create modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la création du projet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals d'investissement dans les projets
    this.registerHandler("invest_project_modal_", async (interaction) => {
      try {
        const { handleInvestModalSubmit } = await import(
          "../features/projects/projects.handlers.js"
        );
        await handleInvestModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling invest project modal:", { error });
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

    // Gestionnaire pour le modal de quantité de ressource pour projet
    this.registerHandler(
      "project_resource_quantity_",
      async (interaction) => {
        try {
          const { handleResourceQuantityModal } = await import(
            "../features/projects/project-creation.js"
          );
          await handleResourceQuantityModal(interaction);
        } catch (error) {
          logger.error("Error handling project resource quantity modal:", {
            error,
          });
          await interaction.reply({
            content: "❌ Erreur lors de l'ajout de la ressource.",
            flags: ["Ephemeral"],
          });
        }
      }
    );

    // =================== BLUEPRINT PROJECTS HANDLERS ===================
    // Gestionnaire pour le modal de sélection de coût blueprint
    this.registerHandler("project_blueprint_cost_quantity:", async (interaction) => {
      try {
        const { handleBlueprintCostQuantityModal } = await import(
          "../features/projects/project-creation.js"
        );
        await handleBlueprintCostQuantityModal(interaction);
      } catch (error) {
        logger.error("Error handling blueprint cost quantity modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout du coût blueprint.",
          flags: ["Ephemeral"],
        });
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

/**
 * 📋 RÉCAPITULATIF DES CONSIGNES DE SÉCURITÉ - MODAL HANDLER
 *
 * ✅ POUR AJOUTER UN NOUVEAU HANDLER :
 * 1. Aller dans registerDefaultHandlers() ligne 61
 * 2. Ajouter APRÈS le commentaire "NOUVEAUX HANDLERS" ligne 290
 * 3. Respecter le format : this.registerHandler("nom_modal", handler)
 * 4. Tester immédiatement après ajout
 *
 * ❌ À NE PAS FAIRE :
 * - Ne pas modifier les handlers existants
 * - Ne pas supprimer de handlers
 * - Ne pas changer l'ordre des handlers
 * - Ne pas ajouter en dehors de la zone sécurisée
 *
 * 🔍 MODALS ACTUELLEMENT SUPPORTÉS :
 * - character_creation_modal : création personnage
 * - reroll_modal : reroll personnage
 * - character_admin_advanced_modal_ : admin personnages avancées
 * - expedition_creation_modal : création expédition
 * - expedition_modify_modal : modification expédition
 * - expedition_transfer_amount_modal_ : transfert expédition
 * - invest_modal : investissement chantiers
 * - stock_admin_add_modal_ : ajout ressources admin
 * - stock_admin_remove_modal_ : retrait ressources admin
 *
 * 🛡️ PROTECTION CONTRE LES RÉGRESSIONS :
 * - Commentaires de sécurité explicites
 * - Zone d'ajout clairement délimitée
 * - Liste exhaustive des handlers existants
 * - Instructions détaillées pour les modifications futures
 */
