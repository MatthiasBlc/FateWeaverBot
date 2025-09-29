import { CommandInteraction, GuildMember } from "discord.js";
import { logger } from "../services/logger";
import { config } from "../config/index";

export async function isAdmin(
  interaction: CommandInteraction
): Promise<boolean> {
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
    return false;
  }

  // Vérifier si l'utilisateur est propriétaire de la guilde ou a les permissions administrateur Discord
  const isOwner = interaction.guild.ownerId === interaction.user.id;
  const hasAdminPermissions = interaction.member.permissions.has("Administrator");

  // L'utilisateur est admin s'il est propriétaire ou a les permissions administrateur Discord
  return isOwner || hasAdminPermissions;
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
