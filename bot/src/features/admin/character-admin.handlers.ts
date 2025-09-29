import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";

export async function handleCharacterAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    logger.info("Début de handleCharacterAdminCommand", {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn("Utilisateur non admin tente d'utiliser la commande character-admin", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });
      return;
    }

    logger.info("Utilisateur vérifié comme admin", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      logger.warn("Aucune ville trouvée pour le serveur", {
        guildId: interaction.guildId,
      });
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer tous les personnages de la guilde
    const characters = await apiService.getGuildCharacters(town.guildId);

    if (!characters || characters.length === 0) {
      await interaction.reply({
        content: "❌ Aucun personnage trouvé dans cette guilde.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le menu de sélection des personnages
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("character_select")
      .setPlaceholder("Choisissez un personnage à modifier")
      .addOptions(
        characters.map((character: any) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${character.name || character.user?.username || "Personnage sans nom"}`)
            .setDescription(
              `PA: ${character.paTotal || 0} | Faim: ${getHungerLevelText(character.hungerLevel || 0)}`
            )
            .setValue(character.id)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "👤 **Administration des Personnages**\nSélectionnez un personnage à modifier :",
      components: [row],
      flags: ["Ephemeral"],
    });

    // Créer un event listener pour gérer la sélection du personnage
    const filter = (i: any) =>
      i.customId === "character_select" && i.user.id === interaction.user.id;

    try {
      const selectInteraction = await interaction.channel?.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 300000, // 5 minutes
      });

      if (!selectInteraction) return;

      const selectedCharacterId = selectInteraction.values[0];
      const selectedCharacter = characters.find((c: any) => c.id === selectedCharacterId);

      if (!selectedCharacter) {
        await selectInteraction.reply({
          content: "❌ Personnage non trouvé.",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Créer le modal pour modifier les valeurs
      const modal = createCharacterStatsModal(selectedCharacter);

      await selectInteraction.showModal(modal);

      // Gérer la soumission du modal
      const modalFilter = (i: any) =>
        i.customId === "character_stats_modal" && i.user.id === interaction.user.id;

      const modalInteraction = await selectInteraction.awaitModalSubmit({
        filter: modalFilter,
        time: 300000,
      });

      const paValue = modalInteraction.fields.getTextInputValue("pa_input");
      const hungerValue = modalInteraction.fields.getTextInputValue("hunger_input");

      const paNumber = parseInt(paValue, 10);
      const hungerNumber = parseInt(hungerValue, 10);

      // Validation des valeurs
      const errors = [];
      if (isNaN(paNumber) || paNumber < 0 || paNumber > 4) {
        errors.push("Les PA doivent être un nombre entre 0 et 4");
      }
      if (isNaN(hungerNumber) || hungerNumber < 0 || hungerNumber > 4) {
        errors.push("Le niveau de faim doit être un nombre entre 0 et 4");
      }

      if (errors.length > 0) {
        await modalInteraction.reply({
          content: `❌ ${errors.join(", ")}`,
          flags: ["Ephemeral"],
        });
        return;
      }

      // Préparer les données de mise à jour
      const updateData: any = {};
      if (!isNaN(paNumber)) updateData.paTotal = paNumber;
      if (!isNaN(hungerNumber)) updateData.hungerLevel = hungerNumber;

      // Mettre à jour le personnage
      const updatedCharacter = await apiService.updateCharacterStats(selectedCharacterId, updateData);

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Personnage Modifié")
        .setDescription(`**${selectedCharacter.name || selectedCharacter.user?.username}** a été modifié avec succès.`)
        .addFields(
          {
            name: "PA",
            value: `${selectedCharacter.paTotal || 0} → ${paNumber}`,
            inline: true,
          },
          {
            name: "Faim",
            value: `${getHungerLevelText(selectedCharacter.hungerLevel || 0)} → ${getHungerLevelText(hungerNumber)}`,
            inline: true,
          },
          {
            name: "\u200B",
            value: "\u200B",
            inline: true,
          }
        )
        .setTimestamp();

      await modalInteraction.reply({ embeds: [embed], flags: ["Ephemeral"] });

    } catch (error) {
      logger.error("Erreur lors de la sélection ou soumission du modal:", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "❌ Temps écoulé ou erreur lors de la sélection/modification.",
          flags: ["Ephemeral"],
        });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la préparation de la commande character-admin:", {
      guildId: interaction.guildId,
      userId: interaction.user.id,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la préparation de la commande.",
      flags: ["Ephemeral"],
    });
  }
}

function createCharacterStatsModal(character: any) {
  const modal = new ModalBuilder()
    .setCustomId("character_stats_modal")
    .setTitle(`Modifier ${character.name || character.user?.username}`);

  const paInput = new TextInputBuilder()
    .setCustomId("pa_input")
    .setLabel("Points d'Action (0-4)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez un nombre entre 0 et 4")
    .setValue((character.paTotal || 0).toString())
    .setMinLength(1)
    .setMaxLength(1);

  const hungerInput = new TextInputBuilder()
    .setCustomId("hunger_input")
    .setLabel("Niveau de Faim (0-4)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez un nombre entre 0 et 4")
    .setValue((character.hungerLevel || 0).toString())
    .setMinLength(1)
    .setMaxLength(1);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(paInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(hungerInput);

  modal.addComponents([firstRow, secondRow]);

  return modal;
}

function getHungerLevelText(level: number): string {
  switch (level) {
    case 0:
      return "En bonne santé";
    case 1:
      return "Faim";
    case 2:
      return "Affamé";
    case 3:
      return "Agonie";
    case 4:
      return "Mort";
    default:
      return "Inconnu";
  }
}
