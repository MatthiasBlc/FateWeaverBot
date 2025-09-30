import { logger } from "../services/logger.js";
import { apiService } from "../services/api/index.js";

/**
 * Gestionnaire centralisé des interactions de boutons
 */
export class ButtonHandler {
  private static instance: ButtonHandler;
  private handlers: Map<string, (interaction: any) => Promise<void>> = new Map();

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
  public registerHandler(buttonId: string, handler: (interaction: any) => Promise<void>) {
    this.handlers.set(buttonId, handler);
    logger.info(`Registered button handler for: ${buttonId}`);
  }

  /**
   * Enregistre les gestionnaires par défaut
   */
  private registerDefaultHandlers() {
    // Gestionnaire pour les boutons de nourriture
    this.registerHandlerByPrefix('eat_food', async (interaction) => {
      await interaction.deferUpdate();

      try {
        const { handleEatButton } = await import('../features/hunger/hunger.handlers.js');
        
        // Extraire l'ID du personnage de l'ID personnalisé du bouton
        const characterId = interaction.customId.split(':')[1];
        
        if (!characterId) {
          throw new Error("ID du personnage manquant dans l'ID du bouton");
        }
        
        // Récupérer le personnage par son ID
        const character = await apiService.getCharacterById(characterId);
        
        if (!character) {
          await interaction.editReply({
            content: "❌ Personnage introuvable.",
            embeds: [],
            components: []
          });
          return;
        }
        
        await handleEatButton(interaction, character);
      } catch (error) {
        logger.error("Error handling eat button:", { error });
        await interaction.editReply({
          content: "❌ Une erreur est survenue lors de l'action de manger.",
          embeds: [],
          components: []
        });
      }
    });

    // Gestionnaire pour les boutons d'administration de personnages
    // Ces boutons sont gérés par awaitMessageComponent dans character-admin.handlers.ts
    this.registerHandlerByPrefix('character_', async (interaction) => {
      // Ne rien faire - laisser le système awaitMessageComponent gérer ces boutons
      logger.info(`Character button ${interaction.customId} - letting awaitMessageComponent handle it`);
      // Retourner sans rien faire pour indiquer que c'est géré
    });
  }

  /**
   * Enregistre un gestionnaire pour tous les boutons commençant par un préfixe
   */
  private registerHandlerByPrefix(prefix: string, handler: (interaction: any) => Promise<void>) {
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
        if (key.startsWith('prefix:') && customId.startsWith(key.substring(7))) {
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
