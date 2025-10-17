import { logger } from "../services/logger.js";
import { apiService } from "../services/api/index.js";
import { httpClient } from "../services/httpClient.js";

/**
 * Gestionnaire centralisé des interactions de boutons
 */
export class ButtonHandler {
  private static instance: ButtonHandler;
  private handlers: Map<string, (interaction: any) => Promise<void>> =
    new Map();

  private constructor() {
    this.registerDefaultHandlers();
  }

  public static getInstance(): ButtonHandler {
    if (!ButtonHandler.instance) {
      ButtonHandler.instance = new ButtonHandler();
    }
    return ButtonHandler.instance;
  }

  /**
   * Enregistre un gestionnaire pour un bouton spécifique
   */
  public registerHandler(
    buttonId: string,
    handler: (interaction: any) => Promise<void>
  ) {
    this.handlers.set(buttonId, handler);
    logger.info(`Registered button handler for: ${buttonId}`);
  }

  /**
   * Enregistre les gestionnaires par défaut
   * ⚠️ ATTENTION : Ne pas modifier ou supprimer les gestionnaires existants !
   * Liste des gestionnaires critiques à préserver :
   * - expedition_ : boutons d'expédition
   * - eat_food : boutons de nourriture
   * - use_cataplasme : utilisation cataplasmes
   * - character_admin_ : administration personnages
   * - capability_admin_ : administration capacités
   * - use_capability : utilisation capacités utilisateur
   * - expedition_admin_ : administration expéditions
   */
  private registerDefaultHandlers() {
    // ================== GESTIONNAIRES CRITIQUES - NE PAS MODIFIER ==================
    // Gestionnaire pour les boutons d'expédition
    this.registerHandlerByPrefix("expedition_", async (interaction) => {
      const customId = interaction.customId;

      if (customId === "expedition_leave") {
        const { handleExpeditionLeaveButton } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionLeaveButton(interaction);
      } else if (customId === "expedition_transfer") {
        const { handleExpeditionTransferButton } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionTransferButton(interaction);
      } else if (customId === "expedition_create_new") {
        const { handleExpeditionCreateNewButton } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionCreateNewButton(interaction);
      } else if (customId === "expedition_join_existing") {
        const { handleExpeditionJoinExistingButton } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionJoinExistingButton(interaction);
      } else if (customId.startsWith("expedition_admin_")) {
        const { handleExpeditionAdminButton } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionAdminButton(interaction);
      } else if (customId.startsWith("expedition_emergency_return:")) {
        const { handleEmergencyReturnButton } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleEmergencyReturnButton(interaction);
      } else if (customId.startsWith("expedition_choose_direction:")) {
        const { handleExpeditionChooseDirection } = await import(
          "../features/expeditions/expedition.command.js"
        );
        await handleExpeditionChooseDirection(interaction);
      }
    });

    // Gestionnaire pour les boutons de nourriture (vivres)
    this.registerHandlerByPrefix("eat_food", async (interaction) => {
      await interaction.deferUpdate();

      try {
        const { handleEatButton } = await import(
          "../features/hunger/hunger.handlers.js"
        );

        // Extraire l'ID du personnage de l'ID personnalisé du bouton
        const characterId = interaction.customId.split(":")[1];

        if (!characterId) {
          throw new Error("ID du personnage manquant dans l'ID du bouton");
        }

        // Récupérer le personnage par son ID
        const character = await apiService.characters.getCharacterById(characterId);

        if (!character) {
          await interaction.editReply({
            content: "❌ Personnage introuvable.",
            embeds: [],
            components: [],
          });
          return;
        }

        await handleEatButton(interaction, character);
      } catch (error) {
        logger.error("Error handling eat food button:", { error });
        await interaction.editReply({
          content: "❌ Une erreur est survenue lors de l'action de manger.",
          embeds: [],
          components: [],
        });
      }
    });

    // Gestionnaire pour les boutons de nourriture alternative
    this.registerHandlerByPrefix("eat_nourriture", async (interaction) => {
      await interaction.deferUpdate();

      try {
        const { handleEatAlternativeButton } = await import(
          "../features/hunger/hunger.handlers.js"
        );

        // Extraire l'ID du personnage de l'ID personnalisé du bouton
        const characterId = interaction.customId.split(":")[1];

        if (!characterId) {
          throw new Error("ID du personnage manquant dans l'ID du bouton");
        }

        // Récupérer le personnage par son ID
        const character = await apiService.characters.getCharacterById(characterId);

        if (!character) {
          await interaction.editReply({
            content: "❌ Personnage introuvable.",
            embeds: [],
            components: [],
          });
          return;
        }

        await handleEatAlternativeButton(interaction, character);
      } catch (error) {
        logger.error("Error handling eat nourriture button:", { error });
        await interaction.editReply({
          content: "❌ Une erreur est survenue lors de l'action de manger.",
          embeds: [],
          components: [],
        });
      }
    });

    // Gestionnaire pour le bouton "Manger +" (menu avancé)
    this.registerHandlerByPrefix("eat_more", async (interaction) => {
      try {
        const { handleEatMoreButton } = await import(
          "../features/hunger/eat-more.handlers.js"
        );
        await handleEatMoreButton(interaction);
      } catch (error) {
        logger.error("Error handling eat more button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage du menu avancé.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour manger 1 vivre
    this.registerHandlerByPrefix("eat_vivre_1", async (interaction) => {
      try {
        const { handleEatVivre1Button } = await import(
          "../features/hunger/eat-more.handlers.js"
        );
        await handleEatVivre1Button(interaction);
      } catch (error) {
        logger.error("Error handling eat vivre 1 button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la consommation.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour manger 1 nourriture
    this.registerHandlerByPrefix("eat_nourriture_1", async (interaction) => {
      try {
        const { handleEatNourriture1Button } = await import(
          "../features/hunger/eat-more.handlers.js"
        );
        await handleEatNourriture1Button(interaction);
      } catch (error) {
        logger.error("Error handling eat nourriture 1 button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la consommation.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour manger vivres à satiété
    this.registerHandlerByPrefix("eat_vivre_full", async (interaction) => {
      try {
        const { handleEatVivreFull } = await import(
          "../features/hunger/eat-more.handlers.js"
        );
        await handleEatVivreFull(interaction);
      } catch (error) {
        logger.error("Error handling eat vivre full button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la consommation.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour manger nourriture à satiété
    this.registerHandlerByPrefix("eat_nourriture_full", async (interaction) => {
      try {
        const { handleEatNourritureFull } = await import(
          "../features/hunger/eat-more.handlers.js"
        );
        await handleEatNourritureFull(interaction);
      } catch (error) {
        logger.error("Error handling eat nourriture full button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la consommation.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour utiliser un cataplasme
    this.registerHandlerByPrefix("use_cataplasme", async (interaction) => {
      await interaction.deferUpdate();

      try {
        // Extraire l'ID du personnage de l'ID personnalisé du bouton
        const characterId = interaction.customId.split(":")[1];

        // Appel API backend pour utiliser un cataplasme
        const response = await httpClient.post(
          `/characters/${characterId}/use-cataplasme`
        );

        if (response.data.success) {
          await interaction.editReply({
            content: `✅ ${response.data.message}`,
            embeds: [],
            components: [],
          });
        } else {
          await interaction.editReply({
            content: `❌ ${response.data.message || "Impossible d'utiliser le cataplasme."}`,
            embeds: [],
            components: [],
          });
        }
      } catch (error: any) {
        logger.error("Error handling use cataplasme button:", { error });

        const errorMessage = error.response?.data?.error ||
                            error.response?.data?.message ||
                            "Une erreur est survenue lors de l'utilisation du cataplasme.";

        await interaction.editReply({
          content: `❌ ${errorMessage}`,
          embeds: [],
          components: [],
        });
      }
    });

    // Gestionnaire pour les boutons d'administration de personnages
    this.registerHandlerByPrefix("character_admin_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling character admin button:", { error });
        await interaction.reply({
          content:
            "❌ Erreur lors du traitement de l'interaction d'administration.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les boutons de gestion des capacités
    this.registerHandlerByPrefix("capability_admin_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling capability admin button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la gestion des capacités.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les boutons de gestion des objets
    this.registerHandlerByPrefix("object_admin_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling object admin button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la gestion des objets.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les boutons de gestion des compétences
    this.registerHandlerByPrefix("skill_admin_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling skill admin button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de la gestion des compétences.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les boutons du profil utilisateur (capacités, etc.)
    this.registerHandlerByPrefix("use_capability", async (interaction) => {
      try {
        const { handleProfileButtonInteraction } = await import(
          "../features/users/users.handlers.js"
        );
        await handleProfileButtonInteraction(interaction);
      } catch (error) {
        logger.error("Error handling profile button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage du retrait de ressources.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton d'ajout de stock admin
    this.registerHandler("stock_admin_add", async (interaction) => {
      try {
        const { handleStockAdminAddButton } = await import(
          "../features/admin/stock-admin.command.js"
        );
        await handleStockAdminAddButton(interaction);
      } catch (error) {
        logger.error("Error handling stock admin add button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage de l'ajout de ressources.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton de retrait de stock admin
    this.registerHandler("stock_admin_remove", async (interaction) => {
      try {
        const { handleStockAdminRemoveButton } = await import(
          "../features/admin/stock-admin.command.js"
        );
        await handleStockAdminRemoveButton(interaction);
      } catch (error) {
        logger.error("Error handling stock admin remove button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage du retrait de ressources.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Participer" des chantiers
    this.registerHandler("chantier_participate", async (interaction) => {
      try {
        const { handleParticipateButton } = await import(
          "../features/chantiers/chantiers.handlers.js"
        );
        await handleParticipateButton(interaction);
      } catch (error) {
        logger.error("Error handling chantier participate button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la participation au chantier.",
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandler("next_season", async (interaction) => {
      logger.info("🎯 Bouton NEXT_SEASON cliqué par:", { user: interaction.user.username });

      try {
        await interaction.deferUpdate();

        // Récupérer la saison actuelle pour connaître la suivante
        const currentResponse = await httpClient.get('/seasons/current');

        if (!currentResponse.data) {
          await interaction.editReply({
            content: "❌ Impossible de récupérer la saison actuelle.",
            embeds: [],
            components: []
          });
          return;
        }

        logger.info("📊 Saison actuelle récupérée:", { season: currentResponse.data });

        const currentSeason = currentResponse.data;

        // Vérifier la structure des données
        if (!currentSeason || !currentSeason.name) {
          logger.error("❌ Structure de données invalide:", { received: currentSeason });
          await interaction.editReply({
            content: "❌ Format de données de saison invalide.",
            embeds: [],
            components: []
          });
          return;
        }

        // Déterminer la prochaine saison (cycle été/hiver uniquement)
        const currentSeasonName = currentSeason.name.toLowerCase();
        const nextSeason = currentSeasonName === 'summer' ? 'winter' : 'summer';

        logger.info("🔄 Changement de saison:", { from: currentSeasonName, to: nextSeason });

        // Changer la saison
        const response = await httpClient.post('/seasons/set', {
          season: nextSeason,
          adminId: interaction.user.id
        });

        logger.info("✅ Réponse de changement de saison reçue:", { status: response.status, data: response.data });

        const result = response.data;
        const embed = {
          color: getSeasonColor(result.newSeason),
          title: "✅ Saison changée avec succès",
          fields: [
            {
              name: "🔄 Changement",
              value: [
                `**Ancienne saison :** ${formatSeasonName(result.oldSeason)}`,
                `**Nouvelle saison :** ${formatSeasonName(result.newSeason)}`,
                `**Changée par :** ${interaction.user.username}`,
                `**Date :** ${new Date().toLocaleString('fr-FR')}`
              ].join('\n'),
              inline: false
            }
          ],
          footer: {
            text: "Administration - Changement de saison"
          },
          timestamp: new Date().toISOString()
        };

        await interaction.editReply({
          embeds: [embed],
          components: [] // Retirer les boutons après le changement
        });

        // Le message de succès est déjà affiché dans l'embed de réponse

      } catch (error: any) {
        logger.error("❌ Erreur lors du changement de saison:", {
          error: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        });
        await interaction.editReply({
          content: `❌ Erreur lors du changement de saison : ${error.message || 'Erreur inconnue'}`,
          embeds: [],
          components: []
        });
      }
    });

    // Gestionnaire pour le bouton "Ajouter une ressource" lors de la création de chantier
    this.registerHandler("chantier_add_resource", async (interaction) => {
      try {
        const { handleAddResourceButton } = await import(
          "../features/chantiers/chantier-creation.js"
        );
        await handleAddResourceButton(interaction);
      } catch (error) {
        logger.error("Error handling chantier add resource button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Créer le chantier" (création finale)
    this.registerHandler("chantier_create_final", async (interaction) => {
      try {
        const { handleCreateFinalButton } = await import(
          "../features/chantiers/chantier-creation.js"
        );
        await handleCreateFinalButton(interaction);
      } catch (error) {
        logger.error("Error handling chantier create final button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la création du chantier.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== PROJECTS HANDLERS ===================
    // Gestionnaire pour le bouton "Participer" des projets
    this.registerHandler("project_participate", async (interaction) => {
      try {
        const { handleParticipateButton } = await import(
          "../features/projects/projects.handlers.js"
        );
        await handleParticipateButton(interaction);
      } catch (error) {
        logger.error("Error handling project participate button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la participation au projet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton de sélection de craft types lors de création de projet
    this.registerHandler("project_select_craft_types", async (interaction) => {
      try {
        const { handleSelectCraftTypesButton } = await import(
          "../features/projects/project-creation.js"
        );
        await handleSelectCraftTypesButton(interaction);
      } catch (error) {
        logger.error("Error handling project select craft types button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection des types d'artisanat.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton de sélection de ressource de sortie
    this.registerHandler("project_select_output", async (interaction) => {
      try {
        const { handleSelectOutputButton } = await import(
          "../features/projects/project-creation.js"
        );
        await handleSelectOutputButton(interaction);
      } catch (error) {
        logger.error("Error handling project select output button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la sélection de la ressource de sortie.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton d'ajout de ressource requise pour projet
    this.registerHandler("project_add_resource", async (interaction) => {
      try {
        const { handleAddResourceButton } = await import(
          "../features/projects/project-creation.js"
        );
        await handleAddResourceButton(interaction);
      } catch (error) {
        logger.error("Error handling project add resource button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout de ressource requise.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Créer le projet" (création finale)
    this.registerHandler("project_create_final", async (interaction) => {
      try {
        const { handleCreateFinalButton } = await import(
          "../features/projects/project-creation.js"
        );
        await handleCreateFinalButton(interaction);
      } catch (error) {
        logger.error("Error handling project create final button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la création du projet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== NEW ELEMENT ADMIN HANDLERS ===================
    // Gestionnaire pour le bouton "Nouvelle Capacité"
    this.registerHandler("new_element_capability", async (interaction) => {
      try {
        const { handleNewCapabilityButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleNewCapabilityButton(interaction);
      } catch (error) {
        logger.error("Error handling new capability button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage du formulaire de capacité.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Nouvelle Ressource"
    this.registerHandler("new_element_resource", async (interaction) => {
      try {
        const { handleNewResourceButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleNewResourceButton(interaction);
      } catch (error) {
        logger.error("Error handling new resource button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage du formulaire de ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Nouvel Objet"
    this.registerHandler("new_element_object", async (interaction) => {
      try {
        const { handleNewObjectButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleNewObjectButton(interaction);
      } catch (error) {
        logger.error("Error handling new object button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage du formulaire d'objet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Nouvelle Compétence"
    this.registerHandler("new_element_skill", async (interaction) => {
      try {
        const { handleNewSkillButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleNewSkillButton(interaction);
      } catch (error) {
        logger.error("Error handling new skill button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage du formulaire de compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== OBJECT BONUS HANDLERS ===================
    // Gestionnaire pour le bouton "Terminé" après création d'objet
    this.registerHandlerByPrefix("object_done:", async (interaction) => {
      try {
        const { handleObjectDoneButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectDoneButton(interaction);
      } catch (error) {
        logger.error("Error handling object done button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de la finalisation de l'objet.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Ajouter bonus Compétence"
    this.registerHandlerByPrefix("object_add_skill_bonus:", async (interaction) => {
      try {
        const { handleObjectAddSkillBonusButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectAddSkillBonusButton(interaction);
      } catch (error) {
        logger.error("Error handling object add skill bonus button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout du bonus de compétence.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Ajouter bonus Capacité"
    this.registerHandlerByPrefix("object_add_capability_bonus:", async (interaction) => {
      try {
        const { handleObjectAddCapabilityBonusButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectAddCapabilityBonusButton(interaction);
      } catch (error) {
        logger.error("Error handling object add capability bonus button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout du bonus de capacité.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Conversion en Ressource"
    this.registerHandlerByPrefix("object_add_resource_conversion:", async (interaction) => {
      try {
        const { handleObjectAddResourceConversionButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectAddResourceConversionButton(interaction);
      } catch (error) {
        logger.error("Error handling object add resource conversion button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout de la conversion en ressource.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== BLUEPRINT PROJECTS HANDLERS ===================
    // Gestionnaire pour les boutons de redémarrage de blueprints
    this.registerHandlerByPrefix("project_restart:", async (interaction) => {
      try {
        const { handleRestartBlueprintButton } = await import(
          "../features/projects/projects.handlers.js"
        );
        await handleRestartBlueprintButton(interaction);
      } catch (error) {
        logger.error("Error handling project restart blueprint button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du redémarrage du blueprint.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton d'ajout de coûts blueprint
    this.registerHandler("project_add_blueprint_costs", async (interaction) => {
      try {
        const { handleAddBlueprintCostButton } = await import(
          "../features/projects/project-creation.js"
        );
        await handleAddBlueprintCostButton(interaction);
      } catch (error) {
        logger.error("Error handling project add blueprint costs button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'ajout de coûts blueprint.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Voir les projets" depuis le profil
    this.registerHandlerByPrefix("view_projects:", async (interaction) => {
      try {
        const { handleViewProjectsFromProfile } = await import(
          "../features/projects/projects.handlers.js"
        );
        await handleViewProjectsFromProfile(interaction);
      } catch (error) {
        logger.error("Error handling view projects button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors de l'affichage des projets.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== COOKING HANDLERS ===================
    // Gestionnaire pour le choix de PA pour cuisiner
    this.registerHandlerByPrefix("cooking_pa:", async (interaction) => {
      try {
        const { handleCookingPAChoice } = await import(
          "../features/users/cooking.handlers.js"
        );
        await handleCookingPAChoice(interaction);
      } catch (error) {
        logger.error("Error handling cooking PA choice:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du choix de PA pour cuisiner.",
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== FISHING HANDLERS ===================
    // Gestionnaire pour le choix de PA pour pêcher
    this.registerHandlerByPrefix("fishing_pa:", async (interaction) => {
      try {
        const { handleFishingPAChoice } = await import(
          "../features/users/fishing.handlers.js"
        );
        await handleFishingPAChoice(interaction);
      } catch (error) {
        logger.error("Error handling fishing PA choice:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du choix de PA pour pêcher.",
          flags: ["Ephemeral"],
        });
      }
    });
  }
  /**
   * Enregistre un gestionnaire pour tous les boutons commençant par un préfixe
   */
  private registerHandlerByPrefix(
    prefix: string,
    handler: (interaction: any) => Promise<void>
  ) {
    this.handlers.set(`prefix:${prefix}`, handler);
  }

  /**
   * Traite une interaction de bouton
   */
  public async handleButton(interaction: any): Promise<boolean> {
    const { customId } = interaction;

    logger.info(`🔍 Button interaction received: ${customId} from ${interaction.user.username}`);

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

    // Aucun gestionnaire trouvé - ne pas répondre automatiquement
    // Laisser le système appelant gérer cette situation
    logger.info(`No handler found for button: ${customId}`);
    return false;
  }

  /**
   * Liste tous les boutons enregistrés (pour le debug)
   */
  public listRegisteredButtons(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Export d'une instance singleton
export const buttonHandler = ButtonHandler.getInstance();

// Fonctions utilitaires pour les saisons
function getSeasonColor(seasonName: string): number {
  switch (seasonName?.toLowerCase()) {
    case 'summer': return 0xffa500; // Orange été
    case 'winter': return 0x87ceeb; // Bleu hiver
    default: return 0x808080; // Gris par défaut
  }
}

function formatSeasonName(seasonName: string): string {
  switch (seasonName?.toLowerCase()) {
    case 'summer': return 'Été';
    case 'winter': return 'Hiver';
    default: return seasonName || 'Inconnue';
  }
}
