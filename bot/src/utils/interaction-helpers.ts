import type {
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  InteractionReplyOptions,
  InteractionUpdateOptions,
} from "discord.js";
import { createErrorEmbed, createSuccessEmbed, createInfoEmbed } from "./embeds";

/**
 * Type union pour tous les types d'interactions
 */
export type AnyInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction
  | StringSelectMenuInteraction;

/**
 * Options pour les réponses éphémères
 */
interface EphemeralReplyOptions {
  content?: string;
  embed?: any;
}

/**
 * Répond à une interaction avec un message d'erreur éphémère
 */
export async function replyError(
  interaction: AnyInteraction,
  message: string,
  details?: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    embeds: [createErrorEmbed(message, details)],
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Répond à une interaction avec un message de succès éphémère
 */
export async function replySuccess(
  interaction: AnyInteraction,
  title: string,
  description?: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    embeds: [createSuccessEmbed(title, description)],
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Répond à une interaction avec un message d'info éphémère
 */
export async function replyInfo(
  interaction: AnyInteraction,
  title: string,
  description?: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    embeds: [createInfoEmbed(title, description || "")],
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Répond avec un simple message texte éphémère
 */
export async function replyEphemeral(
  interaction: AnyInteraction,
  content: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    content,
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Defer une interaction puis exécute une fonction
 * Utile pour les opérations longues
 */
export async function deferAndExecute<T>(
  interaction: AnyInteraction,
  executor: () => Promise<T>,
  options?: { ephemeral?: boolean }
): Promise<T> {
  await interaction.deferReply({
    flags: options?.ephemeral ? ["Ephemeral"] : undefined,
  });

  return await executor();
}

/**
 * Gère une erreur dans une interaction de manière standardisée
 */
export async function handleInteractionError(
  interaction: AnyInteraction,
  error: unknown,
  context: string
): Promise<void> {
  const errorMessage =
    error instanceof Error ? error.message || "Une erreur inconnue s'est produite" : "Une erreur inconnue s'est produite";

  await replyError(
    interaction,
    "Une erreur s'est produite",
    `${context}: ${errorMessage}`
  );
}
