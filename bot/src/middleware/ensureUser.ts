import { CommandInteraction, GuildMember } from "discord.js";
import { apiService } from "../services/api";
import { isAxiosError } from "axios";

export async function ensureUserExists(interaction: CommandInteraction) {
  if (!interaction.guildId || !interaction.member) {
    throw new Error("Cette commande ne peut être utilisée que dans un serveur");
  }

  const member = interaction.member as GuildMember;
  const guildId = interaction.guildId;
  const userId = member.id;
  const username = member.user.username;
  const userAvatar = member.user.displayAvatarURL({
    extension: "png",
    size: 1024,
  });
  const userNickname = member.nickname || null;
  const userRoles = member.roles.cache
    .filter((role) => role.id !== interaction.guildId)
    .map((role) => role.id);

  try {
    console.log(
      `[ensureUserExists] Vérification de l'utilisateur ${userId} (${username})...`
    );

    // 1. Vérifier et créer l'utilisateur si nécessaire
    const user = await apiService.getOrCreateUser(userId, username);
    console.log(
      `[ensureUserExists] Utilisateur ${userId} vérifié:`,
      user ? `ID: ${user.id}` : "non trouvé"
    );

    // 2. Mettre à jour les informations de l'utilisateur
    console.log(
      `[ensureUserExists] Mise à jour des informations de l'utilisateur...`
    );
    await apiService.updateUser(userId, {
      globalName: member.user.username,
      avatar: userAvatar,
      email: `${userId}@discord.app`,
    });

    // 3. Vérifier et créer le serveur si nécessaire
    console.log(`[ensureUserExists] Vérification du serveur ${guildId}...`);
    const server = await apiService.getOrCreateServer(
      guildId,
      interaction.guild?.name || "Serveur inconnu"
    );
    console.log(
      `[ensureUserExists] Serveur ${guildId} vérifié:`,
      server ? `ID: ${server.id}` : "non trouvé"
    );

    // 4. Vérifier et créer le personnage si nécessaire
    console.log(
      `[ensureUserExists] Vérification du personnage pour ${userId} sur ${guildId}...`
    );
    const character = await apiService.getOrCreateCharacter(userId, guildId, {
      nickname: userNickname,
      roles: userRoles,
    });
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
  handler: (interaction: CommandInteraction) => Promise<void>
) {
  return async (interaction: CommandInteraction) => {
    try {
      await ensureUserExists(interaction);
      return handler(interaction);
    } catch (error) {
      console.error("Erreur dans le middleware withUser:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            "Une erreur est survenue lors du traitement de votre commande.",
          ephemeral: true,
        });
      }
    }
  };
}
