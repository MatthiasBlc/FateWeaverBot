import { ButtonInteraction } from "discord.js";
import { logger } from "../services/logger.js";
import { STATUS, SYSTEM } from "../constants/emojis";

// Import feature button registrations
import { registerExpeditionButtons } from "../features/expeditions/buttons.js";
import { registerHungerButtons } from "../features/hunger/buttons.js";
import { registerCharacterAdminButtons } from "../features/admin/character-admin/buttons.js";
import { registerObjectAdminButtons } from "../features/admin/object-admin/buttons.js";
import { registerElementButtons } from "../features/admin/elements/buttons.js";
import { registerUserButtons } from "../features/users/buttons.js";
import { registerStockAdminButtons } from "../features/admin/stock-admin/buttons.js";
import { registerProjectButtons } from "../features/projects/buttons.js";
import { registerChantierButtons } from "../features/chantiers/buttons.js";
import { registerSeasonButtons } from "../features/season/buttons.js";

/**
 * Gestionnaire centralisé des interactions de boutons
 * Agit comme un registry qui délègue aux modules de features
 *
 * Structure :
 * - registerHandler(id) : pour les IDs exacts
 * - registerHandlerByPrefix(prefix) : pour les IDs commençant par un préfixe
 *
 * Chaque module de feature appelle registerHandler() ou registerHandlerByPrefix()
 * pour enregistrer ses propres handlers lors de l'initialisation.
 */
export class ButtonHandler {
  private static instance: ButtonHandler;
  private handlers: Map<string, (interaction: ButtonInteraction) => Promise<void>> =
    new Map();
  private prefixHandlers: Array<{
    prefix: string;
    handler: (interaction: ButtonInteraction) => Promise<void>;
  }> = [];

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
   * Enregistre un gestionnaire pour un bouton spécifique (ID exact)
   */
  public registerHandler(
    buttonId: string,
    handler: (interaction: ButtonInteraction) => Promise<void>
  ) {
    this.handlers.set(buttonId, handler);
    logger.debug(`Registered button handler for: ${buttonId}`);
  }

  /**
   * Enregistre un gestionnaire pour les boutons commençant par un préfixe
   */
  public registerHandlerByPrefix(
    prefix: string,
    handler: (interaction: ButtonInteraction) => Promise<void>
  ) {
    this.prefixHandlers.push({ prefix, handler });
    logger.debug(`Registered prefix handler for: ${prefix}`);
  }

  /**
   * Enregistre tous les handlers de features
   * Les modules de features enregistrent leurs propres handlers
   * via registerHandler() et registerHandlerByPrefix()
   */
  private registerDefaultHandlers() {
    logger.info("🎮 Initializing button handlers from feature modules...");

    // Register all feature button handlers
    registerExpeditionButtons(this);
    registerHungerButtons(this);
    registerCharacterAdminButtons(this);
    registerObjectAdminButtons(this);
    registerElementButtons(this);
    registerUserButtons(this);
    registerStockAdminButtons(this);
    registerProjectButtons(this);
    registerChantierButtons(this);
    registerSeasonButtons(this);

    logger.info(
      `${STATUS.SUCCESS} Button handlers initialized: ${this.handlers.size} exact + ${this.prefixHandlers.length} prefix handlers`
    );
  }

  /**
   * Traite une interaction de bouton
   * Essaie d'abord les correspondances exactes, puis les préfixes
   */
  public async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    const { customId } = interaction;
    logger.debug(
      `🔘 Button interaction: ${customId} from ${interaction.user.username}`
    );

    try {
      // Essayer une correspondance exacte d'abord
      const exactHandler = this.handlers.get(customId);
      if (exactHandler) {
        await exactHandler(interaction);
        return true;
      }

      // Essayer une correspondance de préfixe
      for (const { prefix, handler } of this.prefixHandlers) {
        if (customId.startsWith(prefix)) {
          await handler(interaction);
          return true;
        }
      }

      logger.warn(`${SYSTEM.WARNING} No handler found for button: ${customId}`);
      return false;
    } catch (error) {
      logger.error(`Error handling button ${customId}:`, { error });
      throw error;
    }
  }

  /**
   * Liste tous les IDs de boutons enregistrés (pour le débogage)
   */
  public listRegisteredButtons(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Liste tous les préfixes de boutons enregistrés (pour le débogage)
   */
  public listRegisteredPrefixes(): string[] {
    return this.prefixHandlers.map((h) => h.prefix);
  }
}

// Export singleton instance
export const buttonHandler = ButtonHandler.getInstance();
