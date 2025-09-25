import { GuildMember, ChatInputCommandInteraction } from "discord.js";
import { apiService } from "../services/api";
import { isAxiosError } from "axios";

export async function ensureUserExists(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guildId || !interaction.member) {
    throw new Error("Cette commande ne peut être utilisée que dans un serveur");
  }

  const member = interaction.member as GuildMember;
  const guildId = interaction.guildId;
  const userId = member.id;
  const username = member.user.username;
  const discriminator = member.user.discriminator;
  const globalName = member.user.globalName || null;
  const userAvatar = member.user.displayAvatarURL({
    extension: "png",
    size: 1024,
  });

  try {
    console.log(
      `[ensureUserExists] Vérification de l'utilisateur ${userId} (${username}#${discriminator})...`
    );

    // 1. Vérifier et créer l'utilisateur si nécessaire
    const user = await apiService.getOrCreateUser(
      userId,
      username,
      discriminator
    );
    console.log(
      `[ensureUserExists] Utilisateur ${userId} vérifié:`,
      user ? `ID: ${user.id}` : "non trouvé"
    );

    // 2. Mettre à jour les informations de l'utilisateur
    console.log(
      `[ensureUserExists] Mise à jour des informations de l'utilisateur...`
    );
    await apiService.updateUser(userId, {
      username,
      discriminator,
      globalName,
      avatar: userAvatar,
      email: `${userId}@discord.app`,
    });

    // 3. Vérifier et créer le serveur si nécessaire
    console.log(`[ensureUserExists] Vérification du serveur ${guildId}...`);
    const server = await apiService.getOrCreateServer(
      guildId,
      interaction.guild?.name || "Serveur inconnu",
      interaction.guild?.memberCount || 0
    );
    console.log(
      `[ensureUserExists] Serveur ${guildId} vérifié:`,
      server ? `ID: ${server.id}` : "non trouvé"
    );

    // 3.1 Synchroniser les rôles du serveur
    console.log(
      `[ensureUserExists] Synchronisation des rôles pour le serveur ${guildId}...`
    );
    const guildRoles = Array.from(
      interaction.guild?.roles.cache.values() || []
    );

    // Filtrer pour ne garder que les rôles qui ne sont pas le rôle @everyone
    const rolesToSync = guildRoles.filter(
      (role) => role.id !== interaction.guildId
    );

    // Synchroniser chaque rôle avec la base de données
    const syncedRoles = await Promise.all(
      rolesToSync.map(async (role) => {
        try {
          const syncedRole = await apiService.upsertRole(
            server.id,
            role.id,
            role.name,
            role.hexColor
          );
          return syncedRole;
        } catch (error) {
          console.error(
            `[ensureUserExists] Erreur lors de la synchronisation du rôle ${role.id}:`,
            error
          );
          return null;
        }
      })
    );

    // Filtrer les rôles qui ont été synchronisés avec succès
    const validSyncedRoles = syncedRoles.filter(
      (role): role is NonNullable<typeof role> => role !== null
    );
    console.log(
      `[ensureUserExists] ${validSyncedRoles.length}/${rolesToSync.length} rôles synchronisés avec succès`
    );

    // 4. Vérifier et créer le personnage si nécessaire
    console.log(
      `[ensureUserExists] Vérification du personnage pour ${userId} sur ${guildId}...`
    );
    const character = await apiService.getOrCreateCharacter(
      userId,
      guildId,
      interaction.guild?.name || "Serveur inconnu",
      {
        username: user.username,
        nickname: member.nickname || null,
        roles: member.roles.cache
          .filter((role) => role.id !== interaction.guildId) // Exclure le rôle @everyone
          .map((role) => role.id),
      },
      interaction.client
    );
    console.log(
      `[ensureUserExists] Personnage vérifié:`,
      character ? `ID: ${character.id}` : "non trouvé"
    );

    return { user, server, character };
  } catch (error) {
    console.error(
      "[ensureUserExists] Erreur lors de la vérification/création de l'utilisateur :",
      error
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
      console.error("Error in withUser middleware:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content:
              error instanceof Error
                ? error.message
                : "Une erreur inconnue est survenue.",
            ephemeral: true,
          })
          .catch(console.error);
      } else if (interaction.deferred) {
        await interaction
          .editReply({
            content:
              error instanceof Error
                ? error.message
                : "Une erreur inconnue est survenue.",
          })
          .catch(console.error);
      }
    }
  };
}
