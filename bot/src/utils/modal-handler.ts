import { ModalSubmitInteraction } from "discord.js";
import { logger } from "../services/logger.js";
import { STATUS } from "../constants/emojis.js";


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
  private handlers: Map<string, (interaction: ModalSubmitInteraction) => Promise<void>> =
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
    handler: (interaction: ModalSubmitInteraction) => Promise<void>
  ) {
    this.handlers.set(modalId, handler);
    logger.info(`Registered modal handler for: ${modalId}`);
  }

  /**
   * Enregistre un gestionnaire pour tous les modals commençant par un préfixe
   */
  public registerHandlerByPrefix(
    prefix: string,
    handler: (interaction: ModalSubmitInteraction) => Promise<void>
  ) {
    this.handlers.set(`prefix:${prefix}`, handler);
    logger.info(`Registered modal handler for prefix: ${prefix}`);
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
          content: `${STATUS.ERROR} Erreur lors de la création du personnage.`,
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
          content: `${STATUS.ERROR} Erreur lors du reroll du personnage.`,
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
              `${STATUS.ERROR} Erreur lors de la modification des statistiques avancées du personnage.`,
            flags: ["Ephemeral"],
          });
        }
      }
    );

    // Gestionnaire pour les modals de création d'expédition
    this.registerHandler("expedition_creation_modal", async (interaction) => {
      try {
        const { handleExpeditionCreationModal } = await import(
          "../features/expeditions/handlers/expedition-create.js"
        );
        await handleExpeditionCreationModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition creation modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la création de l'expédition.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de quantité de ressource lors de création d'expédition
    this.registerHandler("expedition_create_resource_quantity:", async (interaction) => {
      try {
        const { handleExpeditionResourceQuantityModal } = await import(
          "../features/expeditions/handlers/expedition-create-resources.js"
        );
        await handleExpeditionResourceQuantityModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition create resource quantity modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout de la ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal d'ajout de ressource (gestion ressources)
    this.registerHandler("expedition_resource_add_quantity:", async (interaction) => {
      try {
        const { handleExpeditionResourceAddQuantity } = await import(
          "../features/expeditions/handlers/expedition-resource-management.js"
        );
        await handleExpeditionResourceAddQuantity(interaction);
      } catch (error) {
        logger.error("Error handling expedition resource add quantity modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout de la ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de retrait de ressource (gestion ressources)
    this.registerHandler("expedition_resource_remove_quantity:", async (interaction) => {
      try {
        const { handleExpeditionResourceRemoveQuantity } = await import(
          "../features/expeditions/handlers/expedition-resource-management.js"
        );
        await handleExpeditionResourceRemoveQuantity(interaction);
      } catch (error) {
        logger.error("Error handling expedition resource remove quantity modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du retrait de la ressource.`,
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
          content: `${STATUS.ERROR} Erreur lors de la modification de l'expédition.`,
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
            content: `${STATUS.ERROR} Erreur lors du transfert de nourriture.`,
            flags: ["Ephemeral"],
          });
        }
      }
    );

    // Gestionnaire pour le modal de modification de durée d'expédition
    this.registerHandler("expedition_duration_modal_", async (interaction: ModalSubmitInteraction) => {
      try {
        const { handleExpeditionDurationModal } = await import(
          "../features/admin/expedition-admin-resource-handlers.js"
        );
        await handleExpeditionDurationModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition duration modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la durée.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal d'ajout de ressource à une expédition
    this.registerHandler("expedition_resource_add_modal_", async (interaction: ModalSubmitInteraction) => {
      try {
        const { handleExpeditionResourceAddModal } = await import(
          "../features/admin/expedition-admin-resource-handlers.js"
        );
        await handleExpeditionResourceAddModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition resource add modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de modification de ressource d'une expédition
    this.registerHandler("expedition_resource_modify_modal_", async (interaction: ModalSubmitInteraction) => {
      try {
        const { handleExpeditionResourceModifyModal } = await import(
          "../features/admin/expedition-admin-resource-handlers.js"
        );
        await handleExpeditionResourceModifyModal(interaction);
      } catch (error) {
        logger.error("Error handling expedition resource modify modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de ressource.`,
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
              `${STATUS.ERROR} Erreur lors du traitement du formulaire d'investissement.`,
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.followUp({
            content:
              `${STATUS.ERROR} Erreur lors du traitement du formulaire d'investissement.`,
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
              `${STATUS.ERROR} Erreur lors du traitement du formulaire d'ajout de ressources.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content:
              `${STATUS.ERROR} Erreur lors du traitement du formulaire d'ajout de ressources.`,
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
              `${STATUS.ERROR} Erreur lors du traitement du formulaire de retrait de ressources.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content:
              `${STATUS.ERROR} Erreur lors du traitement du formulaire de retrait de ressources.`,
          });
        }
      }
    });

    // =================== NOUVEAUX HANDLERS ===================
    // ⚠️ AJOUTER LES NOUVEAUX HANDLERS CI-DESSOUS SEULEMENT

    // Gestionnaire pour le modal d'ajout de projet admin (étape 1)
    this.registerHandler("project_admin_add_step1_modal", async (interaction) => {
      try {
        const { handleProjectAdminAddStep1Modal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAdminAddStep1Modal(interaction);
      } catch (error) {
        logger.error("Error handling project admin add step1 modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de la création du projet.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors de la création du projet.`,
          });
        }
      }
    });

    // Gestionnaire pour les modals de modification de projet admin
    this.registerHandler("project_admin_edit_modal", async (interaction) => {
      try {
        const { handleProjectAdminEditModal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAdminEditModal(interaction);
      } catch (error) {
        logger.error("Error handling project admin edit modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de la modification du projet.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors de la modification du projet.`,
          });
        }
      }
    });

    // Gestionnaires pour le flux de création de projet (multi-étapes)
    this.registerHandler("project_admin_add_step1_modal", async (interaction) => {
      try {
        const { handleProjectAdminAddStep1Modal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAdminAddStep1Modal(interaction);
      } catch (error) {
        logger.error("Error handling project admin add step1 modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de la création du projet.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors de la création du projet.`,
          });
        }
      }
    });

    this.registerHandlerByPrefix("project_add_quantity_modal:", async (interaction) => {
      try {
        const { handleProjectAddQuantityModal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddQuantityModal(interaction);
      } catch (error) {
        logger.error("Error handling project add quantity modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors du traitement.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors du traitement.`,
          });
        }
      }
    });

    // Note: project_add_pa_modal est géré par project_add_quantity_modal (PA + quantité combinés)

    this.registerHandlerByPrefix("project_add_resource_quantity_modal:", async (interaction) => {
      try {
        const { handleProjectAddResourceQuantityModal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddResourceQuantityModal(interaction);
      } catch (error) {
        logger.error("Error handling project add resource quantity modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
          });
        }
      }
    });

    this.registerHandlerByPrefix("project_add_blueprint_pa_modal:", async (interaction) => {
      try {
        const { handleProjectAddBlueprintPAModal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddBlueprintPAModal(interaction);
      } catch (error) {
        logger.error("Error handling project add blueprint PA modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors du traitement.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors du traitement.`,
          });
        }
      }
    });

    this.registerHandlerByPrefix("project_add_blueprint_resource_quantity_modal:", async (interaction) => {
      try {
        const { handleProjectAddBlueprintResourceQuantityModal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddBlueprintResourceQuantityModal(interaction);
      } catch (error) {
        logger.error("Error handling project add blueprint resource quantity modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource blueprint.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource blueprint.`,
          });
        }
      }
    });

    this.registerHandlerByPrefix("project_add_name_modal:", async (interaction) => {
      try {
        const { handleProjectAddNameModal } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddNameModal(interaction);
      } catch (error) {
        logger.error("Error handling project add name modal:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de la mise à jour du nom.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors de la mise à jour du nom.`,
          });
        }
      }
    });

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
          content: `${STATUS.ERROR} Erreur lors de la création du chantier.`,
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
            content: `${STATUS.ERROR} Erreur lors de l'ajout de la ressource.`,
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
          content: `${STATUS.ERROR} Erreur lors de la création du projet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals d'investissement dans les projets
    this.registerHandlerByPrefix("invest_project_modal_", async (interaction) => {
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
              `${STATUS.ERROR} Erreur lors du traitement du formulaire d'investissement.`,
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.followUp({
            content:
              `${STATUS.ERROR} Erreur lors du traitement du formulaire d'investissement.`,
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
            content: `${STATUS.ERROR} Erreur lors de l'ajout de la ressource.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'ajout du coût blueprint.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== NEW ELEMENT ADMIN HANDLERS ===================
    // Gestionnaire pour le modal de création de capacité
    this.registerHandler("new_capability_modal", async (interaction) => {
      try {
        const { handleCapabilityModalSubmit } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleCapabilityModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling new capability modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la création de la capacité.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de création de ressource
    // Gestionnaire pour le modal de création de ressource avec emojis sélectionnés
    const handleNewResourceModalAny = async (interaction: ModalSubmitInteraction) => {
      try {
        const { handleResourceModalSubmit } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleResourceModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling new resource modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la création de la ressource.`,
          flags: ["Ephemeral"],
        });
      }
    };
    // Enregistrer pour le format new_resource_modal:emoji
    this.handlers.set("new_resource_modal", handleNewResourceModalAny);

    // Gestionnaire pour le modal de création d'objet
    this.registerHandler("new_object_modal", async (interaction) => {
      try {
        const { handleObjectModalSubmit } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling new object modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la création de l'objet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de création de compétence
    this.registerHandler("new_skill_modal", async (interaction) => {
      try {
        const { handleSkillModalSubmit } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleSkillModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling new skill modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la création de la compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== EMOJI MODALS HANDLERS ===================
    // Gestionnaire pour le modal d'ajout d'emoji (format: emoji_add_modal:resource)
    // Utilise un préfixe pour supporter tous les types (resource, capability, etc.)
    const handleEmojiAddModalAny = async (interaction: ModalSubmitInteraction) => {
      try {
        const { handleEmojiAddModal } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiAddModal(interaction);
      } catch (error) {
        logger.error("Error handling emoji add modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout de l'emoji.`,
          flags: ["Ephemeral"],
        });
      }
    };

    // Enregistrer pour tous les types
    this.handlers.set("emoji_add_modal:resource", handleEmojiAddModalAny);
    this.handlers.set("emoji_add_modal:capability", handleEmojiAddModalAny);
    this.handlers.set("emoji_add_modal:object", handleEmojiAddModalAny);
    this.handlers.set("emoji_add_modal:skill", handleEmojiAddModalAny);
    this.handlers.set("emoji_add_modal:action", handleEmojiAddModalAny);
    this.handlers.set("emoji_add_modal:custom", handleEmojiAddModalAny);


    // =================== OBJECT BONUS MODALS HANDLERS ===================
    // Gestionnaire pour le modal de bonus de compétence sur objet
    this.registerHandler("object_skill_bonus_modal:", async (interaction) => {
      try {
        const { handleObjectSkillBonusModalSubmit } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectSkillBonusModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling object skill bonus modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout du bonus de compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de bonus de capacité sur objet
    // Gestionnaire pour le modal de conversion en ressource sur objet
    this.registerHandler("object_resource_conversion_modal:", async (interaction) => {
      try {
        const { handleObjectResourceConversionModalSubmit } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectResourceConversionModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling object resource conversion modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout de la conversion en ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== EDIT/DELETE MODALS ===================
    // Gestionnaire pour le modal de modification de ressource
    this.registerHandler("edit_resource_modal:", async (interaction) => {
      try {
        const { handleEditResourceModalSubmit } = await import(
          "../features/admin/element-resource-admin.handlers.js"
        );
        await handleEditResourceModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling edit resource modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de modification d'objet
    this.registerHandler("edit_object_modal:", async (interaction) => {
      try {
        const { handleEditObjectModalSubmit } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleEditObjectModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling edit object modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de l'objet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de modification de compétence
    this.registerHandler("edit_skill_modal:", async (interaction) => {
      try {
        const { handleEditSkillModalSubmit } = await import(
          "../features/admin/element-skill-admin.handlers.js"
        );
        await handleEditSkillModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling edit skill modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de modification de capacité
    this.registerHandler("edit_capability_modal:", async (interaction) => {
      try {
        const { handleEditCapabilityModalSubmit } = await import(
          "../features/admin/element-capability-admin.handlers.js"
        );
        await handleEditCapabilityModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling edit capability modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la capacité.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de modification du nom d'objet
    this.registerHandler("edit_object_name_modal:", async (interaction) => {
      try {
        const { handleEditObjectNameModalSubmit } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleEditObjectNameModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling edit object name modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification du nom.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le modal de modification de la description d'objet
    this.registerHandler("edit_object_description_modal:", async (interaction) => {
      try {
        const { handleEditObjectDescriptionModalSubmit } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleEditObjectDescriptionModalSubmit(interaction);
      } catch (error) {
        logger.error("Error handling edit object description modal:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la description.`,
          flags: ["Ephemeral"],
        });
      }
    });
  }

  /**
   * Traite une interaction de modal
   */
  public async handleModal(interaction: ModalSubmitInteraction): Promise<boolean> {
    const { customId } = interaction;

    logger.info(`Modal interaction received: ${customId}`);

    // Chercher un gestionnaire exact
    let handler = this.handlers.get(customId);

    // Si pas trouvé, chercher par préfixe
    if (!handler) {
      for (const [key, handlerFn] of this.handlers.entries()) {
        if (
          key.startsWith("prefix:") &&
          customId.startsWith(key.substring(7))
        ) {
          handler = handlerFn;
          break;
        }
      }
    }

    if (handler) {
      await handler(interaction);
      return true;
    }

    // Aucun gestionnaire trouvé
    logger.info(`No handler found for modal: ${customId}`);
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
