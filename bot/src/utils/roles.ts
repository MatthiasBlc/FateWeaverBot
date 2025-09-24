import { CommandInteraction, GuildMember } from "discord.js";
import { config } from "../config";

export async function isAdmin(
  interaction: CommandInteraction
): Promise<boolean> {
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
    return false;
  }

  // Vérifier si l'utilisateur a le rôle admin
  const hasAdminRole = interaction.member.roles.cache.some(
    (role) => role.id === config.ADMIN_ROLE
  );

  // Vérifier si l'utilisateur est propriétaire du serveur
  const isOwner = interaction.guild.ownerId === interaction.user.id;

  return hasAdminRole || isOwner;
}

export async function checkAdmin(
  interaction: CommandInteraction
): Promise<boolean> {
  const isUserAdmin = await isAdmin(interaction);
  if (!isUserAdmin) {
    await interaction.reply({
      content: "❌ Seuls les administrateurs peuvent effectuer cette action.",
      ephemeral: true,
    });
    return false;
  }
  return true;
}
