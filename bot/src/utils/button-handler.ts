import { logger } from "../services/logger.js";
import { apiService } from "../services/api/index.js";

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
   */
  private registerDefaultHandlers() {
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
      } else if (customId.startsWith("expedition_admin_")) {
        const { handleExpeditionAdminButton } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionAdminButton(interaction);
      }
    });

    // Gestionnaire pour les boutons de nourriture
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
        logger.error("Error handling eat button:", { error });
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
          content: "❌ Erreur lors du traitement de l'interaction du profil.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les boutons d'administration d'expédition
    this.registerHandlerByPrefix("expedition_admin_", async (interaction) => {
      try {
        const { handleExpeditionAdminButton } = await import(
          "../features/admin/expedition-admin.handlers.js"
        );
        await handleExpeditionAdminButton(interaction);
      } catch (error) {
        logger.error("Error handling expedition admin button:", { error });
        await interaction.reply({
          content:
            "❌ Erreur lors du traitement de l'interaction d'administration d'expédition.",
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

    logger.info(`Button interaction received: ${customId}`);

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
