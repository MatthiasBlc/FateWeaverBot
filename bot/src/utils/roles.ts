import { CommandInteraction, GuildMember } from "discord.js";
import { logger } from "../services/logger";

export async function isAdmin(
  interaction: CommandInteraction
): Promise<boolean> {
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
    return false;
  }

  // Vérifier si l'utilisateur a le rôle admin défini dans les variables d'environnement
  const hasAdminRole = interaction.member.roles.cache.some(
    (role) => role.id === process.env.ADMIN_ROLE
  );

  // Vérifier si l'utilisateur est propriétaire du serveur
  const isOwner = interaction.guild.ownerId === interaction.user.id;

  // Vérifier les permissions administrateur Discord
  const hasAdminPermissions =
    interaction.member.permissions.has("Administrator");

  return hasAdminRole || isOwner || hasAdminPermissions;
}

export async function checkAdmin(
  interaction: CommandInteraction
): Promise<boolean> {
  const isUserAdmin = await isAdmin(interaction);
  if (!isUserAdmin) {
    try {
      await interaction.reply({
        content: "❌ Seuls les administrateurs peuvent effectuer cette action.",
        ephemeral: true,
      });
    } catch (e) {
      logger.error("Erreur lors de l'envoi du message d'erreur :", {
        error: e,
      });
    }
    return false;
  }
  return true;
}
