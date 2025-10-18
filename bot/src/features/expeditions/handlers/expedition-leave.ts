import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  type GuildMember,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { getStatusEmoji } from "../expedition-utils";
import { validateCharacterExists } from "../../../utils/character-validation";
import { replyEphemeral, replyError } from "../../../utils/interaction-helpers";

/**
 * Gestionnaire pour le bouton "Quitter l'expédition"
 */
export async function handleExpeditionLeaveButton(interaction: any) {
  try {
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await replyEphemeral(interaction, "❌ Vous devez avoir un personnage actif pour quitter une expédition. Utilisez d'abord la commande `/start` pour créer un personnage.");
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await replyEphemeral(interaction, "❌ Vous devez avoir un personnage actif pour quitter une expédition.");
      return;
    }

    try {
      validateCharacterExists(character);
    } catch (error) {
      if (error instanceof Error) {
        await replyEphemeral(interaction, error.message);
        return;
      }
      throw error;
    }

    // Get character's active expeditions
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(
      character.id
    );

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await replyEphemeral(interaction, "❌ Votre personnage ne participe à aucune expédition active.");
      return;
    }

    const currentExpedition = activeExpeditions[0];

    // Double-check that the character is actually a member
    const isMember = currentExpedition.members?.some(
      (member) => member.character?.id === character.id
    );

    if (!isMember) {
      await replyEphemeral(interaction, "❌ Votre personnage n'est pas membre de cette expédition.");
      return;
    }

    // Check if expedition is in PLANNING status (only time you can leave)
    if (currentExpedition.status !== "PLANNING") {
      await replyEphemeral(interaction, `❌ Vous ne pouvez pas quitter une expédition qui est déjà **${getStatusEmoji(currentExpedition.status).split(" ")[1]}**.`);
      return;
    }

    // Leave the expedition
    await apiService.leaveExpedition(currentExpedition.id, character.id);

    // Check if expedition was terminated (last member left)
    let expeditionTerminated = false;
    try {
      const updatedExpedition = await apiService.expeditions.getExpeditionById(
        currentExpedition.id
      );
      expeditionTerminated = updatedExpedition?.status === "RETURNED";
    } catch (error) {
      // Expedition might have been deleted if terminated
      expeditionTerminated = true;
    }

    if (expeditionTerminated) {
      // Update the message to show expedition was terminated
      await interaction.update({
        content: `✅ Vous avez quitté l'expédition avec succès!\n\n🏁 **L'expédition a été terminée automatiquement** car vous étiez le dernier membre. Toute la nourriture restante a été restituée à la ville.`,
        embeds: [],
        components: [],
      });

      // Send log message
      const logMessage = `🚪 **${character.name}** a quitté l'expédition "**${currentExpedition.name}**" (dernier membre - expédition terminée)`;
      await sendLogMessage(
        interaction.guildId!,
        interaction.client,
        logMessage
      );
    } else {
      // Update the message to show successful departure
      await interaction.update({
        content: `✅ Vous avez quitté l'expédition **${currentExpedition.name}** avec succès!`,
        embeds: [],
        components: [],
      });

      // Send log message
      const logMessage = `🚪 **${character.name}** a quitté l'expédition "**${currentExpedition.name}**"`;
      await sendLogMessage(
        interaction.guildId!,
        interaction.client,
        logMessage
      );
    }

    logger.info("Character left expedition via Discord button", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      characterName: character.name,
      joinedBy: interaction.user.id,
      expeditionTerminated,
    });
  } catch (error) {
    logger.error("Error in expedition leave button:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors du départ de l'expédition: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
}
