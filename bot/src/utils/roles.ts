import { CommandInteraction, GuildMember } from "discord.js";
import { logger } from "../services/logger";
import { config } from "../config/index";

export async function isAdmin(
  interaction: CommandInteraction
): Promise<boolean> {
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
    return false;
  }

  // Vérifier si l'utilisateur a le rôle admin défini dans les variables d'environnement
  const hasAdminRole = config.bot.adminRoleId
    ? interaction.member.roles.cache.some(
        (role) => role.id === config.bot.adminRoleId
      )
    : false;

  // Vérifier si l'utilisateur est propriétaire de la guilde
  const isOwner = interaction.guild.ownerId === interaction.user.id;

  // Vérifier les permissions administrateur Discord
  const hasAdminPermissions = interaction.member.permissions.has("Administrator");

  // Logique hybride : soit ADMIN_ROLE, soit propriétaire, soit (permissions admin ET ADMIN_ROLE défini)
  return hasAdminRole || isOwner || (hasAdminPermissions && !!config.bot.adminRoleId);
}

export async function checkAdmin(
  interaction: CommandInteraction
): Promise<boolean> {
  const isUserAdmin = await isAdmin(interaction);
  if (!isUserAdmin) {
    try {
      await interaction.reply({
        content: "❌ Seuls les administrateurs peuvent effectuer cette action.",
        flags: ["Ephemeral"],
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
