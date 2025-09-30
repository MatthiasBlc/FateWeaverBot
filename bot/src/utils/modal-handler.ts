import { logger } from "../services/logger.js";

/**
 * Gestionnaire centralisé des interactions de modals
 */
export class ModalHandler {
  private static instance: ModalHandler;
  private handlers: Map<string, (interaction: any) => Promise<void>> = new Map();

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
  public registerHandler(modalId: string, handler: (interaction: any) => Promise<void>) {
    this.handlers.set(modalId, handler);
    logger.info(`Registered modal handler for: ${modalId}`);
  }

  /**
   * Enregistre les gestionnaires par défaut
   */
  private registerDefaultHandlers() {
    // Gestionnaire pour les modals de création de personnage
    this.registerHandler('character_creation_modal', async (interaction) => {
      try {
        const { handleCharacterCreation } = await import('../modals/character-modals.js');
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
    this.registerHandler('reroll_modal', async (interaction) => {
      try {
        const { handleReroll } = await import('../modals/character-modals.js');
        await handleReroll(interaction);
      } catch (error) {
        logger.error("Error handling reroll modal:", { error });
        await interaction.reply({
          content: "❌ Erreur lors du reroll du personnage.",
          flags: ["Ephemeral"],
        });
      }
    });

    // Gestionnaire pour les modals d'administration de personnages
    this.registerHandler('character_stats_modal', async (interaction) => {
      try {
        // Pour les modals d'admin, on délègue à la fonction dédiée
        // On passe l'ID du personnage via les métadonnées du modal ou une autre méthode
        await interaction.reply({
          content: "Modal d'administration - fonctionnalité à implémenter.",
          flags: ["Ephemeral"],
        });
      } catch (error) {
        logger.error("Error handling character stats modal:", { error });
        if (error && typeof error === 'object' && 'code' in error && error.code === 10062) {
          // Interaction expirée, rien à faire
          return;
        }
        await interaction.reply({
          content: "❌ Erreur lors de la modification des statistiques.",
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

    const handler = this.handlers.get(customId);

    if (handler) {
      await handler(interaction);
      return true;
    }

    // Aucun gestionnaire trouvé
    await interaction.reply({
      content: "Modal non reconnu.",
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
