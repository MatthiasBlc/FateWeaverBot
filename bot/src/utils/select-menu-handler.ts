import { logger } from "../services/logger.js";

/**
 * Gestionnaire centralisé des interactions de sélections (StringSelectMenu)
 */
export class SelectMenuHandler {
  private static instance: SelectMenuHandler;
  private handlers: Map<string, (interaction: any) => Promise<void>> =
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
    handler: (interaction: any) => Promise<void>
  ) {
    this.handlers.set(selectId, handler);
    logger.info(`Registered select menu handler for: ${selectId}`);
  }

  /**
   * Enregistre un gestionnaire pour toutes les sélections commençant par un préfixe
   */
  public registerHandlerByPrefix(
    prefix: string,
    handler: (interaction: any) => Promise<void>
  ) {
    this.handlers.set(`prefix:${prefix}`, handler);
    logger.info(`Registered select menu handler for prefix: ${prefix}`);
  }

  /**
   * Enregistre les gestionnaires par défaut
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
          "../features/expeditions/expedition.handlers.js"
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
          "../features/expeditions/expedition.handlers.js"
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
  }

  /**
   * Traite une interaction de sélection
   */
  public async handleSelectMenu(interaction: any): Promise<boolean> {
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
