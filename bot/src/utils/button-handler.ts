import { ButtonInteraction } from "discord.js";
import { logger } from "../services/logger.js";
import { apiService } from "../services/api/index.js";
import { httpClient } from "../services/httpClient.js";
import { STATUS, SYSTEM } from "../constants/emojis.js";


/**
 * Gestionnaire centralisé des interactions de boutons
 */
export class ButtonHandler {
  private static instance: ButtonHandler;
  private handlers: Map<string, (interaction: ButtonInteraction) => Promise<void>> =
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
    handler: (interaction: ButtonInteraction) => Promise<void>
  ) {
    this.handlers.set(buttonId, handler);
    logger.info(`Registered button handler for: ${buttonId}`);
  }

  /**
   * Enregistre les gestionnaires par défaut
   * ATTENTION : Ne pas modifier ou supprimer les gestionnaires existants !
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
      } else if (customId.startsWith("expedition_create_add_resources:")) {
        const { handleExpeditionAddResources } = await import(
          "../features/expeditions/handlers/expedition-create-resources.js"
        );
        await handleExpeditionAddResources(interaction);
      } else if (customId.startsWith("expedition_create_validate:")) {
        const { handleExpeditionValidateResources } = await import(
          "../features/expeditions/handlers/expedition-create-resources.js"
        );
        await handleExpeditionValidateResources(interaction);
      } else if (customId.startsWith("expedition_resource_add:")) {
        const { handleExpeditionResourceAdd } = await import(
          "../features/expeditions/handlers/expedition-resource-management.js"
        );
        await handleExpeditionResourceAdd(interaction);
      } else if (customId.startsWith("expedition_resource_remove:")) {
        const { handleExpeditionResourceRemove } = await import(
          "../features/expeditions/handlers/expedition-resource-management.js"
        );
        await handleExpeditionResourceRemove(interaction);
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
            content: `${STATUS.ERROR} Personnage introuvable.`,
            embeds: [],
            components: [],
          });
          return;
        }

        await handleEatButton(interaction, character);
      } catch (error) {
        logger.error("Error handling eat food button:", { error });
        await interaction.editReply({
          content: `${STATUS.ERROR} Une erreur est survenue lors de l'action de manger.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage du menu avancé.`,
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
          content: `${STATUS.ERROR} Erreur lors de la consommation.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour manger 1 nourriture
    this.registerHandlerByPrefix("eat_nourriture_1", async (interaction) => {
      try {
        const { handleEatRepas1Button } = await import(
          "../features/hunger/eat-more.handlers.js"
        );
        await handleEatRepas1Button(interaction);
      } catch (error) {
        logger.error("Error handling eat nourriture 1 button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la consommation.`,
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
          content: `${STATUS.ERROR} Erreur lors de la consommation.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour manger nourriture à satiété
    this.registerHandlerByPrefix("eat_nourriture_full", async (interaction) => {
      try {
        const { handleEatRepasFull } = await import(
          "../features/hunger/eat-more.handlers.js"
        );
        await handleEatRepasFull(interaction);
      } catch (error) {
        logger.error("Error handling eat nourriture full button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la consommation.`,
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
          // Envoyer le message public au channel admin
          if (response.data.publicMessage && interaction.guildId) {
            const { sendLogMessage } = await import("../utils/channels");
            await sendLogMessage(interaction.guildId, interaction.client, response.data.publicMessage);
          }

          await interaction.editReply({
            content: response.data.message,
            embeds: [],
            components: [],
          });
        } else {
          await interaction.editReply({
            content: `${STATUS.ERROR} ${response.data.message || "Impossible d'utiliser le cataplasme."}`,
            embeds: [],
            components: [],
          });
        }
      } catch (error: unknown) {
        logger.error("Error handling use cataplasme button:", { error });

        const errorMessage = (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
                            (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message ||
                            "Une erreur est survenue lors de l'utilisation du cataplasme.";

        await interaction.editReply({
          content: `${STATUS.ERROR} ${errorMessage}`,
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
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content:
                `${STATUS.ERROR} Erreur lors du traitement de l'interaction d'administration.`,
              flags: ["Ephemeral"],
            });
          } else if (interaction.deferred) {
            await interaction.editReply({
              content:
                `${STATUS.ERROR} Erreur lors du traitement de l'interaction d'administration.`,
            });
          }
        } catch (replyError) {
          logger.error("Cannot reply to character admin interaction (probably expired):", { replyError });
        }
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
          content: `${STATUS.ERROR} Erreur lors du traitement de la gestion des capacités.`,
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
          content: `${STATUS.ERROR} Erreur lors du traitement de la gestion des objets.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les boutons de catégories d'objets
    this.registerHandlerByPrefix("object_category_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling object category button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du traitement de la catégorie d'objets.`,
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
          content: `${STATUS.ERROR} Erreur lors du traitement de la gestion des compétences.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les boutons de catégories de compétences
    this.registerHandlerByPrefix("skill_category_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers.js"
        );
        await handleCharacterAdminInteraction(interaction);
      } catch (error) {
        logger.error("Error handling skill category button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du traitement de la catégorie de compétences.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage du retrait de ressources.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Donner un objet"
    this.registerHandlerByPrefix("give_object:", async (interaction) => {
      try {
        const { handleProfileButtonInteraction } = await import(
          "../features/users/users.handlers.js"
        );
        await handleProfileButtonInteraction(interaction);
      } catch (error) {
        logger.error("Error handling give object button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du traitement de votre objet.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage de l'ajout de ressources.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage du retrait de ressources.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton d'ajout de projet admin
    this.registerHandler("project_admin_add", async (interaction) => {
      try {
        const { handleProjectAdminAddButton } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAdminAddButton(interaction);
      } catch (error) {
        logger.error("Error handling project admin add button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire de création.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton nom optionnel
    this.registerHandlerByPrefix("project_add_optional_name:", async (interaction) => {
      try {
        const { handleProjectAddOptionalName } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddOptionalName(interaction);
      } catch (error) {
        logger.error("Error handling project add optional name button:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire.`,
            flags: ["Ephemeral"],
          });
        }
      }
    });

    // Gestionnaire pour le bouton de validation de sélection (étape 1)
    this.registerHandlerByPrefix("project_add_validate_selection:", async (interaction) => {
      try {
        const { handleProjectAddValidateSelection } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddValidateSelection(interaction);
      } catch (error) {
        logger.error("Error handling project add validate selection:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la validation de la sélection.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton de modification de projet admin
    this.registerHandler("project_admin_edit", async (interaction) => {
      try {
        const { handleProjectAdminEditButton } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAdminEditButton(interaction);
      } catch (error) {
        logger.error("Error handling project admin edit button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'affichage de la modification.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton de suppression de projet admin
    this.registerHandler("project_admin_delete", async (interaction) => {
      try {
        const { handleProjectAdminDeleteButton } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAdminDeleteButton(interaction);
      } catch (error) {
        logger.error("Error handling project admin delete button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'affichage de la suppression.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la confirmation de suppression de projet admin
    this.registerHandlerByPrefix("project_admin_delete_confirm", async (interaction) => {
      try {
        const { handleProjectAdminDeleteConfirm } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAdminDeleteConfirm(interaction);
      } catch (error) {
        logger.error("Error handling project admin delete confirm:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la confirmation de suppression.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaires pour le flux de création de projet (multi-étapes)
    this.registerHandlerByPrefix("project_add_object_category:", async (interaction) => {
      try {
        const { handleProjectAddObjectCategory } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddObjectCategory(interaction);
      } catch (error) {
        logger.error("Error handling project add object category:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la navigation dans les catégories.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandlerByPrefix("project_add_add_resource:", async (interaction) => {
      try {
        const { handleProjectAddAddResource } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddAddResource(interaction);
      } catch (error) {
        logger.error("Error handling project add resource:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandlerByPrefix("project_add_validate_costs:", async (interaction) => {
      try {
        const { handleProjectAddValidateCosts } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddValidateCosts(interaction);
      } catch (error) {
        logger.error("Error handling project validate costs:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la validation.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandlerByPrefix("project_add_blueprint_no:", async (interaction) => {
      try {
        const { handleProjectAddBlueprintNo } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddBlueprintNo(interaction);
      } catch (error) {
        logger.error("Error handling project blueprint no:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la création.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandlerByPrefix("project_add_blueprint_yes:", async (interaction) => {
      try {
        const { handleProjectAddBlueprintYes } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddBlueprintYes(interaction);
      } catch (error) {
        logger.error("Error handling project blueprint yes:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la configuration.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandlerByPrefix("project_add_add_blueprint_resource:", async (interaction) => {
      try {
        const { handleProjectAddAddBlueprintResource } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddAddBlueprintResource(interaction);
      } catch (error) {
        logger.error("Error handling project add blueprint resource:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource blueprint.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandlerByPrefix("project_add_finalize:", async (interaction) => {
      try {
        const { handleProjectAddFinalize } = await import(
          "../features/admin/projects-admin.command.js"
        );
        await handleProjectAddFinalize(interaction);
      } catch (error) {
        logger.error("Error handling project finalize:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la finalisation.`,
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
          content: `${STATUS.ERROR} Erreur lors de la participation au chantier.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton admin "Ajouter un chantier"
    this.registerHandler("chantier_admin_add", async (interaction) => {
      try {
        const { handleAdminAddButton } = await import(
          "../features/chantiers/chantiers.handlers.js"
        );
        await handleAdminAddButton(interaction);
      } catch (error) {
        logger.error("Error handling chantier admin add button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'accès au formulaire d'ajout.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton admin "Supprimer un chantier"
    this.registerHandler("chantier_admin_delete", async (interaction) => {
      try {
        const { handleAdminDeleteButton } = await import(
          "../features/chantiers/chantiers.handlers.js"
        );
        await handleAdminDeleteButton(interaction);
      } catch (error) {
        logger.error("Error handling chantier admin delete button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'accès au formulaire de suppression.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandler("next_season", async (interaction) => {
      logger.info("Bouton NEXT_SEASON cliqué par:", { user: interaction.user.username });

      try {
        await interaction.deferUpdate();

        // Récupérer la saison actuelle pour connaître la suivante
        const currentResponse = await httpClient.get('/seasons/current');

        if (!currentResponse.data) {
          await interaction.editReply({
            content: `${STATUS.ERROR} Impossible de récupérer la saison actuelle.`,
            embeds: [],
            components: []
          });
          return;
        }

        logger.info(`${STATUS.STATS} Saison actuelle récupérée:`, { season: currentResponse.data });

        const currentSeason = currentResponse.data;

        // Vérifier la structure des données
        if (!currentSeason || !currentSeason.name) {
          logger.error(`${STATUS.ERROR} Structure de données invalide:`, { received: currentSeason });
          await interaction.editReply({
            content: `${STATUS.ERROR} Format de données de saison invalide.`,
            embeds: [],
            components: []
          });
          return;
        }

        // Déterminer la prochaine saison (cycle été/hiver uniquement)
        const currentSeasonName = currentSeason.name.toLowerCase();
        const nextSeason = currentSeasonName === 'summer' ? 'winter' : 'summer';

        logger.info(`${SYSTEM.REFRESH} Changement de saison:`, { from: currentSeasonName, to: nextSeason });

        // Changer la saison
        const response = await httpClient.post('/seasons/set', {
          season: nextSeason,
          adminId: interaction.user.id
        });

        logger.info(`${STATUS.SUCCESS} Réponse de changement de saison reçue:`, { status: response.status, data: response.data });

        const result = response.data;
        const embed = {
          color: getSeasonColor(result.newSeason),
          title: `${STATUS.SUCCESS} Saison changée avec succès`,
          fields: [
            {
              name: `${SYSTEM.REFRESH} Changement`,
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

      } catch (error: unknown) {
        logger.error(`${STATUS.ERROR} Erreur lors du changement de saison:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          response: (error as { response?: { data?: unknown } })?.response?.data,
          status: (error as { response?: { status?: number } })?.response?.status
        });
        await interaction.editReply({
          content: `${STATUS.ERROR} Erreur lors du changement de saison : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
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
          content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
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
          content: `${STATUS.ERROR} Erreur lors de la création du chantier.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== PROJECTS HANDLERS ===================
    // Gestionnaire pour le bouton "Participer Projets" (avec pagination)
    this.registerHandlerByPrefix("project_participate", async (interaction) => {
      try {
        const { handleParticipateButton } = await import(
          "../features/projects/projects.handlers.js"
        );
        await handleParticipateButton(interaction);
      } catch (error) {
        logger.error("Error handling project participate button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la participation au projet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Participer Blueprints" (avec pagination)
    this.registerHandlerByPrefix("blueprint_participate", async (interaction) => {
      try {
        const { handleBlueprintParticipateButton } = await import(
          "../features/projects/projects.handlers.js"
        );
        await handleBlueprintParticipateButton(interaction);
      } catch (error) {
        logger.error("Error handling blueprint participate button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la participation au blueprint.`,
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
          content: `${STATUS.ERROR} Erreur lors de la sélection des types d'artisanat.`,
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
          content: `${STATUS.ERROR} Erreur lors de la sélection de la ressource de sortie.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource requise.`,
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
          content: `${STATUS.ERROR} Erreur lors de la création du projet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== NEW ELEMENT ADMIN HANDLERS ===================
    // Gestionnaire pour les boutons de catégorie (niveau 1 du menu)
    this.registerHandler("element_category_resource", async (interaction) => {
      try {
        const { handleElementCategoryButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleElementCategoryButton(interaction);
      } catch (error) {
        logger.error("Error handling element category button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement du menu.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandler("element_category_object", async (interaction) => {
      try {
        const { handleElementCategoryButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleElementCategoryButton(interaction);
      } catch (error) {
        logger.error("Error handling element category button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement du menu.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandler("element_category_skill", async (interaction) => {
      try {
        const { handleElementCategoryButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleElementCategoryButton(interaction);
      } catch (error) {
        logger.error("Error handling element category button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement du menu.`,
          flags: ["Ephemeral"],
        });
      }
    });

    this.registerHandler("element_category_capability", async (interaction) => {
      try {
        const { handleElementCategoryButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleElementCategoryButton(interaction);
      } catch (error) {
        logger.error("Error handling element category button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement du menu.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le menu des emojis
    this.registerHandler("element_category_emoji", async (interaction) => {
      try {
        const { handleEmojiMenuButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiMenuButton(interaction);
      } catch (error) {
        logger.error("Error handling emoji menu button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement du menu des emojis.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour l'ajout d'emoji
    this.registerHandler("emoji_add", async (interaction) => {
      try {
        const { handleEmojiAddButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiAddButton(interaction);
      } catch (error) {
        logger.error("Error handling emoji add button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ouverture du formulaire.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la liste des emojis
    this.registerHandler("emoji_list", async (interaction) => {
      try {
        const { handleEmojiListButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiListButton(interaction);
      } catch (error) {
        logger.error("Error handling emoji list button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'affichage de la liste.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la suppression d'emoji
    this.registerHandler("emoji_remove", async (interaction) => {
      try {
        const { handleEmojiRemoveButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleEmojiRemoveButton(interaction);
      } catch (error) {
        logger.error("Error handling emoji remove button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'ouverture du formulaire.`,
          flags: ["Ephemeral"],
        });
      }
    });

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
          content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire de capacité.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire de ressource.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire d'objet.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire de compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Modifier Ressource"
    this.registerHandler("edit_element_resource", async (interaction) => {
      try {
        const { handleEditResourceButton } = await import(
          "../features/admin/element-resource-admin.handlers.js"
        );
        await handleEditResourceButton(interaction);
      } catch (error) {
        logger.error("Error handling edit resource button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Supprimer Ressource"
    this.registerHandler("delete_element_resource", async (interaction) => {
      try {
        const { handleDeleteResourceButton } = await import(
          "../features/admin/element-resource-admin.handlers.js"
        );
        await handleDeleteResourceButton(interaction);
      } catch (error) {
        logger.error("Error handling delete resource button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de la ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour confirmer la suppression d'une ressource
    this.registerHandlerByPrefix("confirm_delete_resource:", async (interaction) => {
      try {
        const { handleConfirmDeleteResourceButton } = await import(
          "../features/admin/element-resource-admin.handlers.js"
        );
        await handleConfirmDeleteResourceButton(interaction);
      } catch (error) {
        logger.error("Error handling confirm delete resource button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de la ressource.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Modifier Objet"
    this.registerHandler("edit_element_object", async (interaction) => {
      try {
        const { handleEditObjectButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleEditObjectButton(interaction);
      } catch (error) {
        logger.error("Error handling edit object button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de l'objet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Supprimer Objet"
    this.registerHandler("delete_element_object", async (interaction) => {
      try {
        const { handleDeleteObjectButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleDeleteObjectButton(interaction);
      } catch (error) {
        logger.error("Error handling delete object button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de l'objet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour confirmer la suppression d'un objet
    this.registerHandlerByPrefix("confirm_delete_object:", async (interaction) => {
      try {
        const { handleConfirmDeleteObjectButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleConfirmDeleteObjectButton(interaction);
      } catch (error) {
        logger.error("Error handling confirm delete object button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de l'objet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les catégories d'édition d'objet
    this.registerHandlerByPrefix("object_edit_category:", async (interaction) => {
      try {
        const { handleEditObjectCategory } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        const parts = interaction.customId.split(':');
        const category = parts[1] as 'simple' | 'capacity' | 'skill' | 'resource';
        const page = parseInt(parts[2], 10) || 0;
        await handleEditObjectCategory(interaction, category, page);
      } catch (error) {
        logger.error("Error handling object edit category button:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors du chargement de la catégorie.`,
            flags: ["Ephemeral"],
          });
        } else {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors du chargement de la catégorie.`,
          });
        }
      }
    });

    // Gestionnaire pour supprimer un objet par catégorie
    this.registerHandlerByPrefix("object_delete_category:", async (interaction) => {
      try {
        const { handleDeleteObjectCategory } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        const parts = interaction.customId.split(':');
        const category = parts[1] as 'simple' | 'capacity' | 'skill' | 'resource';
        const page = parseInt(parts[2], 10) || 0;
        await handleDeleteObjectCategory(interaction, category, page);
      } catch (error) {
        logger.error("Error handling object delete category button:", { error });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors du chargement de la catégorie.`,
            flags: ["Ephemeral"],
          });
        } else {
          await interaction.editReply({
            content: `${STATUS.ERROR} Erreur lors du chargement de la catégorie.`,
          });
        }
      }
    });

    // Gestionnaire pour modifier le nom d'un objet
    this.registerHandlerByPrefix("object_modify_name:", async (interaction) => {
      try {
        const { handleModifyObjectNameButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleModifyObjectNameButton(interaction);
      } catch (error) {
        logger.error("Error handling object modify name button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification du nom.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour modifier la description d'un objet
    this.registerHandlerByPrefix("object_modify_description:", async (interaction) => {
      try {
        const { handleModifyObjectDescriptionButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleModifyObjectDescriptionButton(interaction);
      } catch (error) {
        logger.error("Error handling object modify description button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la description.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour supprimer un objet
    this.registerHandlerByPrefix("object_delete:", async (interaction) => {
      try {
        const { handleConfirmDeleteObjectButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleConfirmDeleteObjectButton(interaction);
      } catch (error) {
        logger.error("Error handling object delete button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de l'objet.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour gérer les compétences d'un objet
    this.registerHandlerByPrefix("object_modify_skills:", async (interaction) => {
      try {
        const { handleModifyObjectSkillsButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleModifyObjectSkillsButton(interaction);
      } catch (error) {
        logger.error("Error handling object modify skills button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des compétences.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour gérer les capacités d'un objet
    this.registerHandlerByPrefix("object_modify_capabilities:", async (interaction) => {
      try {
        const { handleModifyObjectCapabilitiesButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleModifyObjectCapabilitiesButton(interaction);
      } catch (error) {
        logger.error("Error handling object modify capabilities button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des capacités.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour ajouter une compétence à un objet (mode édition)
    this.registerHandlerByPrefix("object_skill_add:", async (interaction) => {
      try {
        const { handleObjectSkillAddButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectSkillAddButton(interaction);
      } catch (error) {
        logger.error("Error handling object skill add button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des compétences.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour sélectionner une catégorie de compétence à ajouter à un objet
    this.registerHandlerByPrefix("object_skill_category_add:", async (interaction) => {
      try {
        const { handleObjectSkillCategoryAddButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectSkillCategoryAddButton(interaction);
      } catch (error) {
        logger.error("Error handling object skill category add button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des compétences.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour retirer une compétence d'un objet
    this.registerHandlerByPrefix("object_skill_remove:", async (interaction) => {
      try {
        const { handleObjectSkillRemoveButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectSkillRemoveButton(interaction);
      } catch (error) {
        logger.error("Error handling object skill remove button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des compétences.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour ajouter une capacité à un objet
    this.registerHandlerByPrefix("object_capability_add:", async (interaction) => {
      try {
        const { handleObjectCapabilityAddButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectCapabilityAddButton(interaction);
      } catch (error) {
        logger.error("Error handling object capability add button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des capacités.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour retirer une capacité d'un objet
    this.registerHandlerByPrefix("object_capability_remove:", async (interaction) => {
      try {
        const { handleObjectCapabilityRemoveButton } = await import(
          "../features/admin/element-object-admin.handlers.js"
        );
        await handleObjectCapabilityRemoveButton(interaction);
      } catch (error) {
        logger.error("Error handling object capability remove button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des capacités.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Modifier Compétence"
    this.registerHandler("edit_element_skill", async (interaction) => {
      try {
        const { handleEditSkillButton } = await import(
          "../features/admin/element-skill-admin.handlers.js"
        );
        await handleEditSkillButton(interaction);
      } catch (error) {
        logger.error("Error handling edit skill button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Supprimer Compétence"
    this.registerHandler("delete_element_skill", async (interaction) => {
      try {
        const { handleDeleteSkillButton } = await import(
          "../features/admin/element-skill-admin.handlers.js"
        );
        await handleDeleteSkillButton(interaction);
      } catch (error) {
        logger.error("Error handling delete skill button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de la compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour confirmer la suppression d'une compétence
    this.registerHandlerByPrefix("confirm_delete_skill:", async (interaction) => {
      try {
        const { handleConfirmDeleteSkillButton } = await import(
          "../features/admin/element-skill-admin.handlers.js"
        );
        await handleConfirmDeleteSkillButton(interaction);
      } catch (error) {
        logger.error("Error handling confirm delete skill button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de la compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Modifier Capacité"
    this.registerHandler("edit_element_capability", async (interaction) => {
      try {
        const { handleEditCapabilityButton } = await import(
          "../features/admin/element-capability-admin.handlers.js"
        );
        await handleEditCapabilityButton(interaction);
      } catch (error) {
        logger.error("Error handling edit capability button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la modification de la capacité.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour le bouton "Supprimer Capacité"
    this.registerHandler("delete_element_capability", async (interaction) => {
      try {
        const { handleDeleteCapabilityButton } = await import(
          "../features/admin/element-capability-admin.handlers.js"
        );
        await handleDeleteCapabilityButton(interaction);
      } catch (error) {
        logger.error("Error handling delete capability button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de la capacité.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour confirmer la suppression d'une capacité
    this.registerHandlerByPrefix("confirm_delete_capability:", async (interaction) => {
      try {
        const { handleConfirmDeleteCapabilityButton } = await import(
          "../features/admin/element-capability-admin.handlers.js"
        );
        await handleConfirmDeleteCapabilityButton(interaction);
      } catch (error) {
        logger.error("Error handling confirm delete capability button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de la capacité.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour annuler une suppression
    this.registerHandler("cancel_delete", async (interaction) => {
      try {
        const { handleCancelDeleteButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleCancelDeleteButton(interaction);
      } catch (error) {
        logger.error("Error handling cancel delete button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'annulation.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== EMOJI ADMIN HANDLERS ===================
    // Gestionnaire pour confirmer la suppression d'un emoji
    this.registerHandlerByPrefix("confirm_delete_emoji_", async (interaction) => {
      try {
        const { handleEmojiDeleteConfirmation } = await import(
          "../features/admin/emoji-admin.handlers.js"
        );
        await handleEmojiDeleteConfirmation(interaction);
      } catch (error) {
        logger.error("Error handling confirm delete emoji button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de la suppression de l'emoji.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour annuler la suppression d'un emoji
    this.registerHandlerByPrefix("cancel_delete_emoji_", async (interaction) => {
      try {
        const { handleEmojiDeleteCancellation } = await import(
          "../features/admin/emoji-admin.handlers.js"
        );
        await handleEmojiDeleteCancellation(interaction);
      } catch (error) {
        logger.error("Error handling cancel delete emoji button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'annulation.`,
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
          content: `${STATUS.ERROR} Erreur lors de la finalisation de l'objet.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'ajout du bonus de compétence.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour la sélection d'une catégorie de compétence pour un objet
    this.registerHandlerByPrefix("object_skill_category:", async (interaction) => {
      try {
        const { handleObjectSkillCategoryButton } = await import(
          "../features/admin/new-element-admin.handlers.js"
        );
        await handleObjectSkillCategoryButton(interaction);
      } catch (error) {
        logger.error("Error handling object skill category button:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du chargement des compétences.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'ajout du bonus de capacité.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'ajout de la conversion en ressource.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'ajout de coûts blueprint.`,
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
          content: `${STATUS.ERROR} Erreur lors de l'affichage des projets.`,
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
          content: `${STATUS.ERROR} Erreur lors du choix de PA pour cuisiner.`,
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
          content: `${STATUS.ERROR} Erreur lors du choix de PA pour pêcher.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== CARTOGRAPHY HANDLERS ===================
    // Gestionnaire pour le choix de PA pour cartographier
    this.registerHandlerByPrefix("cartography_pa:", async (interaction) => {
      try {
        const { handleCartographyPAChoice } = await import(
          "../features/users/cartography.handlers.js"
        );
        await handleCartographyPAChoice(interaction);
      } catch (error) {
        logger.error("Error handling cartography PA choice:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du choix de PA pour cartographier.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== RESEARCHING HANDLERS ===================
    // Gestionnaire pour le choix de PA pour rechercher
    this.registerHandlerByPrefix("researching_pa:", async (interaction) => {
      try {
        const { handleResearchingPAChoice } = await import(
          "../features/users/researching.handlers.js"
        );
        await handleResearchingPAChoice(interaction);
      } catch (error) {
        logger.error("Error handling researching PA choice:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du choix de PA pour rechercher.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== AUSPICE HANDLERS ===================
    // Gestionnaire pour le choix de PA pour auspice
    this.registerHandlerByPrefix("auspice_pa:", async (interaction) => {
      try {
        const { handleAuspicePAChoice } = await import(
          "../features/users/auspice.handlers.js"
        );
        await handleAuspicePAChoice(interaction);
      } catch (error) {
        logger.error("Error handling auspice PA choice:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du choix de PA pour auspice.`,
          flags: ["Ephemeral"],
        });
      }
    });

    // =================== HEALING HANDLERS ===================
    // Gestionnaire pour le choix de PA pour soigner (1 PA = heal, 2 PA = cataplasme)
    this.registerHandlerByPrefix("healing_pa:", async (interaction) => {
      try {
        const { handleHealingPAChoice } = await import(
          "../features/users/healing.handlers.js"
        );
        await handleHealingPAChoice(interaction);
      } catch (error) {
        logger.error("Error handling healing PA choice:", { error });
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors du choix de PA pour soigner.`,
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
    handler: (interaction: ButtonInteraction) => Promise<void>
  ) {
    this.handlers.set(`prefix:${prefix}`, handler);
  }

  /**
   * Traite une interaction de bouton
   */
  public async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    const { customId } = interaction;

    logger.info(`${SYSTEM.SEARCH} Button interaction received: ${customId} from ${interaction.user.username}`);

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
