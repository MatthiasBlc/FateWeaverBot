import { logger } from "../services/logger.js";

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
    this.registerHandler('eat_food', async (interaction) => {
      await interaction.deferUpdate();

      try {
        const { handleEatButton } = await import('../features/hunger/hunger.handlers.js');
        await handleEatButton(interaction);
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
    this.registerHandlerByPrefix('character_', async (interaction) => {
      try {
        // Pour les boutons d'admin, on délègue à la commande character-admin
        await interaction.reply({
          content: "Cette action doit être effectuée via la commande `/character-admin`.",
          flags: ["Ephemeral"],
        });
      } catch (error) {
        logger.error("Error handling character admin button:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du traitement de l'action d'administration.",
          flags: ["Ephemeral"],
        });
      }
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

    // Aucun gestionnaire trouvé
    await interaction.reply({
      content: "Bouton non reconnu.",
      flags: ["Ephemeral"],
    });
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
