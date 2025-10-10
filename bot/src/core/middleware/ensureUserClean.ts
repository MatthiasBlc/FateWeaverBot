import { ChatInputCommandInteraction } from "discord.js";
import { apiService } from "../../services/api";
import { isAxiosError } from "axios";
import { logger } from "../../services/logger";

/**
 * Middleware qui vérifie et crée l'utilisateur et la guilde SANS créer automatiquement de personnage
 * La création de personnage est maintenant gérée par ensureCharacter
 */
export async function ensureUserExists(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guildId || !interaction.member) {
    throw new Error("Cette commande ne peut être utilisée que dans une guilde");
  }

  const member = interaction.member as any;
  const guildId = interaction.guildId;
  const userId = member.id;
  const username = member.user.username;
  const discriminator = member.user.discriminator;
  const globalName = member.user.globalName || null;
  const isDevelopment = process.env.NODE_ENV !== "production";
  const userAvatar = isDevelopment
    ? "https://example.com/default-avatar.png"
    : member.user.displayAvatarURL({
        extension: "png",
        size: 1024,
      });

  // Déclarer les variables en dehors du try-catch
  let user: any = null;
  let guild: any = null;

  try {
    logger.info(
      `[ensureUserExists] Vérification de l'utilisateur ${userId} (${username}#${discriminator})...`
    );

    // 1. Vérifier et créer l'utilisateur si nécessaire
    try {
      user = await apiService.getOrCreateUser(userId, username, discriminator);
      logger.info(
        `[ensureUserExists] Utilisateur ${userId} vérifié: ${
          user ? `ID: ${user.id}` : "non trouvé"
        }`
      );
    } catch (error) {
      logger.error(
        `[ensureUserExists] Échec de vérification utilisateur ${userId}:`,
        { error: error instanceof Error ? error.message : error }
      );
      // En développement, on peut continuer sans l'utilisateur
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }

    // 2. Mettre à jour les informations de l'utilisateur (optionnel)
    if (user) {
      try {
        logger.info(
          `[ensureUserExists] Mise à jour des informations de l'utilisateur...`
        );
        await apiService.updateUser(userId, {
          username,
          discriminator,
          globalName,
          avatar: userAvatar,
          email: `${userId}@discord.app`,
        });
      } catch (error) {
        logger.warn(
          `[ensureUserExists] Échec de mise à jour utilisateur ${userId}:`,
          { error: error instanceof Error ? error.message : error }
        );
      }
    }

    // 3. Vérifier et créer la guilde si nécessaire
    try {
      logger.info(`[ensureUserExists] Vérification de la guilde ${guildId}...`);
      guild = await apiService.getOrCreateGuild(
        guildId,
        interaction.guild?.name || "Serveur inconnu",
        interaction.guild?.memberCount || 0
      );
      logger.info(
        `[ensureUserExists] Guilde ${guildId} vérifiée: ${
          guild ? `ID: ${guild.id}` : "non trouvée"
        }`
      );
    } catch (error) {
      logger.error(
        `[ensureUserExists] Échec de vérification guilde ${guildId}:`,
        { error: error instanceof Error ? error.message : error }
      );
      // En développement, on peut continuer sans la guilde
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }

    // NOTE: Plus de création automatique de personnage ici !
    // Cette responsabilité est maintenant déléguée au middleware ensureCharacter

    return { user, guild, character: null }; // character est maintenant géré ailleurs
  } catch (error) {
    logger.error(
      "[ensureUserExists] Erreur lors de la vérification/création de l'utilisateur :",
      { error }
    );

    // Type guard to check if error is an AxiosError
    if (isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    // If it's a standard Error, use its message
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for any other type of error
    throw new Error(
      "Une erreur est survenue lors de la vérification de votre compte"
    );
  }
}

export function withUser(
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>
) {
  return async (interaction: ChatInputCommandInteraction) => {
    try {
      await ensureUserExists(interaction);
      return await handler(interaction);
    } catch (error) {
      logger.error("Error in withUser middleware:", { error });

      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content:
              error instanceof Error
                ? error.message
                : "Une erreur inconnue est survenue.",
            flags: ["Ephemeral"],
          })
          .catch((e) =>
            logger.error("Reply error in withUser middleware:", { error: e })
          );
      } else if (interaction.deferred) {
        await interaction
          .editReply({
            content:
              error instanceof Error
                ? error.message
                : "Une erreur inconnue est survenue.",
          })
          .catch((e) =>
            logger.error("Edit reply error in withUser middleware:", {
              error: e,
            })
          );
      }
    }
  };
}
