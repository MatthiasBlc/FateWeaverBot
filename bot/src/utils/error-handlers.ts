import { logger } from "../services/logger";
import { STATUS } from "../constants/emojis";
import type {
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction
} from "discord.js";

/**
 * Types d'interactions Discord supportées
 */
type DiscordInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ModalSubmitInteraction;

/**
 * Options pour la gestion d'erreur
 */
interface ErrorHandlerOptions {
  context?: string;
  ephemeral?: boolean;
  customMessage?: string;
  logData?: Record<string, unknown>;
}

/**
 * Gère les erreurs API avec réponse Discord standardisée
 * Remplace les 623+ blocs try-catch répétitifs
 */
export async function handleApiError(
  error: unknown,
  interaction: DiscordInteraction,
  options: ErrorHandlerOptions = {}
): Promise<void> {
  const {
    context = "API operation",
    ephemeral = true,
    customMessage,
    logData = {}
  } = options;

  // Log l'erreur avec contexte
  logger.error(`Error in ${context}`, {
    ...logData,
    error: error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : error,
    interactionType: interaction.type,
    customId: 'customId' in interaction ? interaction.customId : undefined
  });

  // Message d'erreur par défaut ou personnalisé
  const errorMessage = customMessage || `${STATUS.ERROR} Une erreur est survenue lors de ${context}.`;

  // Répondre à l'interaction si possible
  try {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: errorMessage,
        ephemeral
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: errorMessage
      });
    } else {
      await interaction.followUp({
        content: errorMessage,
        ephemeral
      });
    }
  } catch (replyError) {
    logger.error("Cannot reply to interaction (probably expired)", {
      context,
      replyError
    });
  }
}

/**
 * Wrapper pour exécuter une fonction async avec gestion d'erreur automatique
 * Utilisation: await withErrorHandler(interaction, async () => { ... }, { context: "..." })
 */
export async function withErrorHandler<T>(
  interaction: DiscordInteraction,
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    await handleApiError(error, interaction, options);
    return undefined;
  }
}

/**
 * Vérifie si une erreur est une erreur 404 (ressource non trouvée)
 */
export function is404Error(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if (!('response' in error)) return false;

  const response = error.response;
  if (!response || typeof response !== 'object') return false;
  if (!('status' in response)) return false;

  return response.status === 404;
}

/**
 * Vérifie si une erreur contient un message spécifique
 */
export function errorContains(error: unknown, searchString: string): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes(searchString.toLowerCase());
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message.toLowerCase().includes(searchString.toLowerCase());
  }

  return false;
}

/**
 * Extrait un message d'erreur lisible depuis n'importe quel type d'erreur
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
}
