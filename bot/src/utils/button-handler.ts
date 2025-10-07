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
          "../features/expeditions/expedition.handlers.js"
        );
        await handleExpeditionLeaveButton(interaction);
      } else if (customId === "expedition_transfer") {
        const { handleExpeditionTransferButton } = await import(
          "../features/expeditions/expedition.handlers.js"
        );
        await handleExpeditionTransferButton(interaction);
      } else if (customId === "expedition_create_new") {
        const { handleExpeditionCreateNewButton } = await import(
          "../features/expeditions/expedition.handlers.js"
        );
        await handleExpeditionCreateNewButton(interaction);
      } else if (customId === "expedition_join_existing") {
        const { handleExpeditionJoinExistingButton } = await import(
          "../features/expeditions/expedition.handlers.js"
        );
        await handleExpeditionJoinExistingButton(interaction);
      } else if (customId.startsWith("expedition_admin_")) {
        const { handleExpeditionAdminButton } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionAdminButton(interaction);
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
        const character = await apiService.getCharacterById(characterId);

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
        const character = await apiService.getCharacterById(characterId);

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

    // Gestionnaire pour les boutons d'administration de personnages
    this.registerHandlerByPrefix("character_admin_", async (interaction) => {
      try {
        const { handleCharacterAdminInteraction } = await import(
          "../features/admin/character-admin.handlers"
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
          "../features/admin/character-admin.handlers"
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
          "../features/admin/stock-admin.handlers.js"
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
          "../features/admin/stock-admin.handlers.js"
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
