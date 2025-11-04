import { CommandInteraction } from "discord.js";
import { STATUS } from "../constants/emojis.js";


/**
 * Check if the user has admin permissions
 * @param interaction The command interaction
 * @returns True if the user is an admin
 */
export async function checkAdmin(interaction: CommandInteraction): Promise<boolean> {
  if (!interaction.memberPermissions?.has('Administrator')) {
    await interaction.reply({
      content: `${STATUS.ERROR} Vous devez être administrateur pour utiliser cette commande.`,
      ephemeral: true
    });
    return false;
  }
  return true;
}
