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
