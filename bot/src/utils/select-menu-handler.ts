import { StringSelectMenuInteraction } from "discord.js";
import { logger } from "../services/logger.js";

/**
 * Gestionnaire centralisé des interactions de sélections (StringSelectMenu)
 *
 * ⚠️ IMPORTANT - INSTRUCTIONS POUR AJOUTER DE NOUVEAUX HANDLERS :
 *
 * 1. AJOUTER DANS registerDefaultHandlers() UNIQUEMENT
 * 2. NE PAS MODIFIER LES HANDLERS EXISTANTS
 * 3. AJOUTER APRÈS LE DERNIER HANDLER EXISTANT
 * 4. RESPECTER LE FORMAT : this.registerHandler("nom_du_handler", ...)
 * 5. TESTER APRÈS CHAQUE AJOUT
 *
 * 📋 HANDLERS EXISTANTS (NE PAS TOUCHER) :
 * - expedition_join_select
 * - expedition_transfer_direction
 * - expedition_admin_select
 * - expedition_admin_add_member_ (préfixe)
 * - expedition_admin_remove_member_ (préfixe)
 * - stock_admin_add_select
 * - stock_admin_remove_select
 */
export class SelectMenuHandler {
  private static instance: SelectMenuHandler;
  private handlers: Map<string, (interaction: StringSelectMenuInteraction) => Promise<void>> =
    new Map();

  private constructor() {
    this.registerDefaultHandlers();
  }

  public static getInstance(): SelectMenuHandler {
    if (!SelectMenuHandler.instance) {
      SelectMenuHandler.instance = new SelectMenuHandler();
    }
    return SelectMenuHandler.instance;
  }

  /**
   * Enregistre un gestionnaire pour une sélection spécifique
   */
  public registerHandler(
    selectId: string,
    handler: (interaction: StringSelectMenuInteraction) => Promise<void>
  ) {
    this.handlers.set(selectId, handler);
    logger.info(`Registered select menu handler for: ${selectId}`);
  }

  /**
   * Enregistre un gestionnaire pour toutes les sélections commençant par un préfixe
   */
  public registerHandlerByPrefix(
    prefix: string,
    handler: (interaction: StringSelectMenuInteraction) => Promise<void>
  ) {
    this.handlers.set(`prefix:${prefix}`, handler);
    logger.info(`Registered select menu handler for prefix: ${prefix}`);
  }

  /**
   * Enregistre les gestionnaires par défaut
   *
   * ⚠️ ZONE D'AJOUT SÉCURISÉE :
   * Ajouter les nouveaux handlers APRÈS le commentaire "NOUVEAUX HANDLERS"
   * et AVANT la fermeture de la fonction }
   */
  private registerDefaultHandlers() {
    // Gestionnaire pour les sélections d'administration de personnages
    this.registerHandlerByPrefix("character_admin_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling character admin select:", { error });
        await interaction.reply({
          content:
            "❌ Erreur lors du traitement de la sélection d'administration.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les sélections de capacités (avec ou sans ID de personnage)
    this.registerHandlerByPrefix("capability_admin_select", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling capability select:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ Erreur lors du traitement de la sélection de capacité.",
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: "❌ Erreur lors du traitement de la sélection de capacité.",
          });
        }
      }
    });

    // Gestionnaire pour les sélections d'administration d'expédition
    this.registerHandler("expedition_admin_select", async (interaction) => {
      try {
        const { handleExpeditionAdminSelect } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionAdminSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition admin select:", { error });
        await interaction.reply({
          content:
            "❌ Erreur lors du traitement de la sélection d'administration d'expédition.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les sélections d'expédition
    this.registerHandler("expedition_join_select", async (interaction) => {
      try {
        const { handleExpeditionJoinSelect } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionJoinSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition join select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la sélection d'expédition.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les sélections de direction de transfert d'expédition
    this.registerHandler("expedition_transfer_direction", async (interaction) => {
      try {
        const { handleExpeditionTransferDirectionSelect } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionTransferDirectionSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition transfer direction select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la sélection de direction de transfert.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les sélections d'ajout de membres d'expédition admin
    this.registerHandlerByPrefix("expedition_admin_add_member_", async (interaction) => {
      try {
        const { handleExpeditionAdminAddMember } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionAdminAddMember(interaction);
      } catch (error) {
        logger.error("Error handling expedition admin add member select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la sélection d'ajout de membre.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les sélections de retrait de membres d'expédition admin
    this.registerHandlerByPrefix("expedition_admin_remove_member_", async (interaction) => {
      try {
        const { handleExpeditionAdminRemoveMember } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionAdminRemoveMember(interaction);
      } catch (error) {
        logger.error("Error handling expedition admin remove member select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la sélection de retrait de membre.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de ressource à ajouter (admin expédition)
    this.registerHandlerByPrefix("expedition_admin_resource_add_select_", async (interaction) => {
      try {
        const { handleExpeditionAdminResourceAddSelect } = await import(
          "../features/admin/expedition-admin-resource-handlers.js"
        );
        await handleExpeditionAdminResourceAddSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition admin resource add select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource à ajouter.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de ressource à modifier (admin expédition)
    this.registerHandlerByPrefix("expedition_admin_resource_modify_select_", async (interaction) => {
      try {
        const { handleExpeditionAdminResourceModifySelect } = await import(
          "../features/admin/expedition-admin-resource-handlers.js"
        );
        await handleExpeditionAdminResourceModifySelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition admin resource modify select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource à modifier.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de ressource à supprimer (admin expédition)
    this.registerHandlerByPrefix("expedition_admin_resource_delete_select_", async (interaction) => {
      try {
        const { handleExpeditionAdminResourceDeleteSelect } = await import(
          "../features/admin/expedition-admin-resource-handlers.js"
        );
        await handleExpeditionAdminResourceDeleteSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition admin resource delete select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource à supprimer.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les sélections d'ajout de stock admin
    this.registerHandler("stock_admin_add_select", async (interaction) => {
      try {
        const { handleStockAdminAddSelect } = await import(
          "../features/admin/stock-admin/stock-add.js"
        );
        await handleStockAdminAddSelect(interaction);
      } catch (error) {
        logger.error("Error handling stock admin add select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la sélection d'ajout de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les sélections de retrait de stock admin
    this.registerHandler("stock_admin_remove_select", async (interaction) => {
      try {
        const { handleStockAdminRemoveSelect } = await import(
          "../features/admin/stock-admin/stock-remove.js"
        );
        await handleStockAdminRemoveSelect(interaction);
      } catch (error) {
        logger.error("Error handling stock admin remove select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la sélection de retrait de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== NOUVEAUX HANDLERS ===================
    // ⚠️ AJOUTER LES NOUVEAUX HANDLERS CI-DESSOUS SEULEMENT
    // Ne pas modifier les handlers existants au-dessus de cette ligne
    // ========================================================

    // Gestionnaire pour la sélection de ressource lors de la création de chantier
    this.registerHandler("chantier_select_resource", async (interaction) => {
      try {
        const { handleResourceSelect } = await import(
          "../features/chantiers/chantier-creation.js"
        );
        await handleResourceSelect(interaction);
      } catch (error) {
        logger.error("Error handling chantier select resource:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== PROJECTS HANDLERS ===================
    // NOTE: select_project_invest et select_project_delete sont gérés via awaitMessageComponent
    // dans projects.handlers.ts et project-creation.ts respectivement, donc pas de handlers ici

    // Gestionnaire pour la sélection des types d'artisanat lors de création de projet
    this.registerHandler("project_craft_type_select", async (interaction) => {
      try {
        const { handleCraftTypeSelect } = await import(
          "../features/projects/project-creation.js"
        );
        await handleCraftTypeSelect(interaction);
      } catch (error) {
        logger.error("Error handling project craft type select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection des types d'artisanat.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection du TYPE de sortie (ressource ou objet)
    this.registerHandler("project_output_type_select", async (interaction) => {
      try {
        const { handleOutputTypeSelect } = await import(
          "../features/projects/project-creation.js"
        );
        await handleOutputTypeSelect(interaction);
      } catch (error) {
        logger.error("Error handling project output type select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection du type de sortie.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une RESSOURCE de sortie
    this.registerHandler("project_output_resource_select", async (interaction) => {
      try {
        const { handleOutputResourceSelect } = await import(
          "../features/projects/project-creation.js"
        );
        await handleOutputResourceSelect(interaction);
      } catch (error) {
        logger.error("Error handling project output resource select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la ressource de sortie.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'un OBJET de sortie
    this.registerHandler("project_output_object_select", async (interaction) => {
      try {
        const { handleOutputObjectSelect } = await import(
          "../features/projects/project-creation.js"
        );
        await handleOutputObjectSelect(interaction);
      } catch (error) {
        logger.error("Error handling project output object select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de l'objet de sortie.",
          flags: ["Ephemeral"],
        });
      }
    });

    // DEPRECATED - Gardé pour compatibilité
    this.registerHandler("project_output_select", async (interaction) => {
      try {
        const { handleOutputSelect } = await import(
          "../features/projects/project-creation.js"
        );
        await handleOutputSelect(interaction);
      } catch (error) {
        logger.error("Error handling project output select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la ressource de sortie.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de ressource requise lors de création de projet
    this.registerHandler("project_select_resource", async (interaction) => {
      try {
        const { handleResourceSelect } = await import(
          "../features/projects/project-creation.js"
        );
        await handleResourceSelect(interaction);
      } catch (error) {
        logger.error("Error handling project select resource:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource requise.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== BLUEPRINT PROJECTS HANDLERS ===================
    // Gestionnaire pour la sélection de coût blueprint
    this.registerHandler("project_blueprint_cost_select", async (interaction) => {
      try {
        const { handleBlueprintCostSelect } = await import(
          "../features/projects/project-creation.js"
        );
        await handleBlueprintCostSelect(interaction);
      } catch (error) {
        logger.error("Error handling project blueprint cost select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de coût blueprint.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== EXPEDITION DIRECTION HANDLERS ===================
    // Gestionnaire pour la sélection de direction lors de la création d'expédition
    this.registerHandlerByPrefix("expedition_direction:", async (interaction) => {
      try {
        const { handleExpeditionDirectionSelect } = await import(
          "../features/expeditions/handlers/expedition-create.js"
        );
        await handleExpeditionDirectionSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition direction select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de direction d'expédition.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de ressource lors de la création d'expédition
    this.registerHandlerByPrefix("expedition_create_select_resource:", async (interaction) => {
      try {
        const { handleExpeditionResourceSelected } = await import(
          "../features/expeditions/handlers/expedition-create-resources.js"
        );
        await handleExpeditionResourceSelected(interaction);
      } catch (error) {
        logger.error("Error handling expedition create resource select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de ressource à ajouter (gestion ressources)
    this.registerHandlerByPrefix("expedition_resource_add_select:", async (interaction) => {
      try {
        const { handleExpeditionResourceAddSelect } = await import(
          "../features/expeditions/handlers/expedition-resource-management.js"
        );
        await handleExpeditionResourceAddSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition resource add select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de ressource à retirer (gestion ressources)
    this.registerHandlerByPrefix("expedition_resource_remove_select:", async (interaction) => {
      try {
        const { handleExpeditionResourceRemoveSelect } = await import(
          "../features/expeditions/handlers/expedition-resource-management.js"
        );
        await handleExpeditionResourceRemoveSelect(interaction);
      } catch (error) {
        logger.error("Error handling expedition resource remove select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de direction quotidienne pendant l'expédition
    this.registerHandlerByPrefix("expedition_set_direction:", async (interaction) => {
      try {
        const { handleExpeditionSetDirection } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionSetDirection(interaction);
      } catch (error) {
        logger.error("Error handling expedition set direction select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la définition de direction d'expédition.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de métier lors de la création de personnage
    this.registerHandlerByPrefix("job_select:", async (interaction) => {
      try {
        const { handleJobSelection } = await import(
          "../modals/character-modals.js"
        );
        await handleJobSelection(interaction);
      } catch (error) {
        logger.error("Error handling job selection:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection du métier.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== COOKING HANDLERS ===================
    // Gestionnaire pour la sélection de quantité de vivres à cuisiner
    this.registerHandlerByPrefix("cooking_quantity:", async (interaction) => {
      try {
        const { handleCookingQuantityChoice } = await import(
          "../features/users/cooking.handlers.js"
        );
        await handleCookingQuantityChoice(interaction);
      } catch (error) {
        logger.error("Error handling cooking quantity choice:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du choix de quantité pour cuisiner.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== HEALING HANDLERS ===================
    // Gestionnaire pour la sélection du personnage à soigner
    this.registerHandlerByPrefix("healing_target:", async (interaction) => {
      try {
        const { handleHealingTargetChoice } = await import(
          "../features/users/healing.handlers.js"
        );
        await handleHealingTargetChoice(interaction);
      } catch (error) {
        logger.error("Error handling healing target choice:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la cible à soigner.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== OBJECT ADMIN HANDLERS ===================
    // Gestionnaire pour la sélection d'objets (ajout/retrait)
    this.registerHandlerByPrefix("object_admin_select", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling object admin select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection d'objets.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== SKILL ADMIN HANDLERS ===================
    // Gestionnaire pour la sélection de compétences (ajout/retrait)
    this.registerHandlerByPrefix("skill_admin_select", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling skill admin select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de compétences.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une compétence pour bonus d'objet
    this.registerHandlerByPrefix("object_skill_select:", async (interaction) => {
      try {
        const { handleObjectSkillSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectSkillSelect(interaction);
      } catch (error) {
        logger.error("Error handling object skill select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la confirmation de sélection d'une compétence pour un objet
    this.registerHandlerByPrefix("object_skill_confirm:", async (interaction) => {
      try {
        const { handleObjectSkillSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectSkillSelect(interaction);
      } catch (error) {
        logger.error("Error handling object skill confirm:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout de la compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour l'ajout de compétence à un objet via modification
    this.registerHandlerByPrefix("object_skill_confirm_add:", async (interaction) => {
      try {
        const { handleObjectSkillAddConfirm } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectSkillAddConfirm(interaction);
      } catch (error) {
        logger.error("Error handling object skill confirm add:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout de la compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le retrait de compétence d'un objet
    this.registerHandlerByPrefix("object_skill_remove_select:", async (interaction) => {
      try {
        const { handleObjectSkillRemoveConfirm } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectSkillRemoveConfirm(interaction);
      } catch (error) {
        logger.error("Error handling object skill remove:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la suppression de la compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour l'ajout de capacité à un objet
    this.registerHandlerByPrefix("object_capability_confirm_add:", async (interaction) => {
      try {
        const { handleObjectCapabilityAddConfirm } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectCapabilityAddConfirm(interaction);
      } catch (error) {
        logger.error("Error handling object capability confirm add:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout de la capacité.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le retrait de capacité d'un objet
    this.registerHandlerByPrefix("object_capability_remove_select:", async (interaction) => {
      try {
        const { handleObjectCapabilityRemoveConfirm } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectCapabilityRemoveConfirm(interaction);
      } catch (error) {
        logger.error("Error handling object capability remove:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la suppression de la capacité.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour l'ajout de bonus capacité à un objet (création d'objet)
    this.registerHandlerByPrefix("object_capability_bonus_select:", async (interaction) => {
      try {
        const { handleObjectCapabilityBonusSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectCapabilityBonusSelect(interaction);
      } catch (error) {
        logger.error("Error handling object capability bonus select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout du bonus de capacité.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== EMOJI ADMIN HANDLERS ===================
    // Gestionnaire pour la sélection du type d'emoji (ajout)
    this.registerHandler("emoji_type_select", async (interaction) => {
      try {
        const { handleEmojiTypeSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiTypeSelect(interaction);
      } catch (error) {
        logger.error("Error handling emoji type select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection du type d'emoji.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection du type d'emoji (suppression)
    this.registerHandler("emoji_remove_type_select", async (interaction) => {
      try {
        const { handleEmojiRemoveTypeSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiRemoveTypeSelect(interaction);
      } catch (error) {
        logger.error("Error handling emoji remove type select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection du type d'emoji.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'un emoji spécifique pour suppression
    this.registerHandlerByPrefix("emoji_remove_select:", async (interaction) => {
      try {
        const { handleEmojiRemoveSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiRemoveSelect(interaction);
      } catch (error) {
        logger.error("Error handling emoji remove select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de l'emoji.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection de catégorie d'emoji pour une ressource
    this.registerHandler("resource_emoji_type_select", async (interaction) => {
      try {
        const { handleResourceEmojiCategorySelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleResourceEmojiCategorySelect(interaction);
      } catch (error) {
        logger.error("Error handling resource emoji category select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du chargement des emojis.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'un emoji spécifique pour une ressource
    this.registerHandlerByPrefix("resource_emoji_select:", async (interaction) => {
      try {
        const { handleResourceEmojiSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleResourceEmojiSelect(interaction);
      } catch (error) {
        logger.error("Error handling resource emoji select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de l'emoji.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== EDIT/DELETE SELECT MENUS ===================
    // Gestionnaire pour la sélection d'une ressource à modifier
    this.registerHandler("select_resource_to_edit", async (interaction) => {
      try {
        const { handleSelectResourceToEditMenu } = await import(
          "../features/admin/element-resource-admin.handlers.js"
        );
        await handleSelectResourceToEditMenu(interaction);
      } catch (error) {
        logger.error("Error handling select resource to edit:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une ressource à supprimer
    this.registerHandler("select_resource_to_delete", async (interaction) => {
      try {
        const { handleSelectResourceToDeleteMenu } = await import(
          "../features/admin/element-resource-admin.handlers.js"
        );
        await handleSelectResourceToDeleteMenu(interaction);
      } catch (error) {
        logger.error("Error handling select resource to delete:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'un objet à modifier
    this.registerHandler("select_object_to_edit", async (interaction) => {
      try {
        const { handleSelectObjectToEditMenu } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleSelectObjectToEditMenu(interaction);
      } catch (error) {
        logger.error("Error handling select object to edit:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de l'objet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'un objet à supprimer
    this.registerHandler("select_object_to_delete", async (interaction) => {
      try {
        const { handleSelectObjectToDeleteMenu } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleSelectObjectToDeleteMenu(interaction);
      } catch (error) {
        logger.error("Error handling select object to delete:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de l'objet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection finale d'un objet à supprimer (après catégories)
    this.registerHandler("select_object_to_delete_final", async (interaction) => {
      try {
        const { handleSelectObjectToDeleteFinal } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleSelectObjectToDeleteFinal(interaction);
      } catch (error) {
        logger.error("Error handling select object to delete final:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de l'objet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une compétence à modifier
    this.registerHandler("select_skill_to_edit", async (interaction) => {
      try {
        const { handleSelectSkillToEditMenu } = await import(
          "../features/admin/element-skill-admin.handlers.js"
        );
        await handleSelectSkillToEditMenu(interaction);
      } catch (error) {
        logger.error("Error handling select skill to edit:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une compétence à supprimer
    this.registerHandler("select_skill_to_delete", async (interaction) => {
      try {
        const { handleSelectSkillToDeleteMenu } = await import(
          "../features/admin/element-skill-admin.handlers.js"
        );
        await handleSelectSkillToDeleteMenu(interaction);
      } catch (error) {
        logger.error("Error handling select skill to delete:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une capacité à modifier
    this.registerHandler("select_capability_to_edit", async (interaction) => {
      try {
        const { handleSelectCapabilityToEditMenu } = await import(
          "../features/admin/element-capability-admin.handlers.js"
        );
        await handleSelectCapabilityToEditMenu(interaction);
      } catch (error) {
        logger.error("Error handling select capability to edit:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la capacité.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une capacité à supprimer
    this.registerHandler("select_capability_to_delete", async (interaction) => {
      try {
        const { handleSelectCapabilityToDeleteMenu } = await import(
          "../features/admin/element-capability-admin.handlers.js"
        );
        await handleSelectCapabilityToDeleteMenu(interaction);
      } catch (error) {
        logger.error("Error handling select capability to delete:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la capacité.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une ressource pour la conversion d'objet
    this.registerHandlerByPrefix("object_resource_select:", async (interaction) => {
      try {
        const { handleObjectResourceSelect } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectResourceSelect(interaction);
      } catch (error) {
        logger.error("Error handling object resource select:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== GIVE OBJECT HANDLERS ===================
    // Gestionnaire pour la sélection du destinataire d'un don d'objet
    this.registerHandlerByPrefix("select_give_recipient:", async (interaction) => {
      try {
        const { handleSelectGiveRecipient } = await import(
          "../features/users/give-object.handlers.js"
        );
        await handleSelectGiveRecipient(interaction);
      } catch (error) {
        logger.error("Error handling select give recipient:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection du destinataire.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection des objets à donner
    this.registerHandlerByPrefix("select_give_objects:", async (interaction) => {
      try {
        const { handleSelectGiveObjects } = await import(
          "../features/users/give-object.handlers.js"
        );
        await handleSelectGiveObjects(interaction);
      } catch (error) {
        logger.error("Error handling select give objects:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection des objets.",
          flags: ["Ephemeral"],
        });
      }
    });
  }

  /**
   * Traite une interaction de sélection
   */
  public async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<boolean> {
    const { customId } = interaction;

    logger.info(`Select menu interaction received: ${customId}`);

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
    logger.info(`No handler found for select menu: ${customId}`);
    return false;
  }

  /**
   * Liste toutes les sélections enregistrées (pour le debug)
   */
  public listRegisteredSelectMenus(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Export d'une instance singleton
export const selectMenuHandler = SelectMenuHandler.getInstance();

/**
 * 📋 RÉCAPITULATIF DES INSTRUCTIONS DE SÉCURITÉ
 *
 * ✅ POUR AJOUTER UN NOUVEAU HANDLER :
 * 1. Aller dans registerDefaultHandlers() ligne 68
 * 2. Ajouter APRÈS le commentaire "NOUVEAUX HANDLERS" ligne 222
 * 3. Respecter le format : this.registerHandler("nom", handler)
 * 4. Tester immédiatement après ajout
 *
 * ❌ À NE PAS FAIRE :
 * - Ne pas modifier les handlers existants
 * - Ne pas supprimer de handlers
 * - Ne pas changer l'ordre des handlers
 * - Ne pas ajouter en dehors de la zone sécurisée
 *
 * 🔍 HANDLERS ACTUELLEMENT SUPPORTÉS :
 * - character_admin_* (préfixe)
 * - capability_admin_select
 * - expedition_join_select
 * - expedition_transfer_direction
 * - expedition_admin_select
 * - expedition_admin_add_member_* (préfixe)
 * - expedition_admin_remove_member_* (préfixe)
 * - stock_admin_add_select
 * - stock_admin_remove_select
 */
