import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, type GuildMember } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";

export async function handleViewFoodStockCommand(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer le personnage de l'utilisateur
    let character = null;
    let showEatButton = false;
    let characterHungerStatus = "";

    try {
      character = await apiService.getOrCreateCharacter(
        user.id,
        interaction.guildId!,
        interaction.guild?.name || "Serveur inconnu",
        {
          username: user.username,
          nickname: member.nickname || null,
          roles: member.roles.cache
            .filter((role) => role.id !== interaction.guildId)
            .map((role) => role.id),
        },
        interaction.client
      );

      // Déterminer si le bouton doit être affiché et le statut de faim
      if (character.hungerLevel >= 4) {
        // Personnage mort
        showEatButton = false;
        characterHungerStatus = "💀 Mort - ne peut plus manger";
      } else if (character.hungerLevel === 0) {
        // Personnage en pleine forme
        showEatButton = false;
        characterHungerStatus = "😊 En pleine forme";
      } else {
        // Personnage a faim (niveau 1, 2 ou 3)
        showEatButton = true;
        const hungerText = getHungerLevelText(character.hungerLevel);
        const hungerEmoji = getHungerEmoji(character.hungerLevel);
        characterHungerStatus = `${hungerEmoji} ${hungerText}`;
      }
    } catch (error) {
      // Si on ne peut pas récupérer le personnage, afficher le bouton par défaut
      showEatButton = true;
      characterHungerStatus = "❓ Statut inconnu";
    }

    // Créer l'embed d'information
    const embed = new EmbedBuilder()
      .setColor(getFoodStockColor(town.foodStock))
      .setTitle(`🏪 Stock de Vivres`)
      .setDescription(
        `La ville **${town.name}** dispose actuellement de **${town.foodStock}** vivres.`
      )
      .addFields(
        {
          name: "📊 Stock Actuel",
          value: `${town.foodStock}`,
          inline: true,
        },
        {
          name: "🏘️ Ville",
          value: town.name,
          inline: true,
        },
        {
          name: "💡 Conseil",
          value: getFoodStockAdvice(town.foodStock),
          inline: true,
        }
      )
      .setFooter({
        text: "Utilisez /manger pour nourrir votre personnage",
        iconURL: interaction.client.user?.displayAvatarURL(),
      })
      .setTimestamp();

    // Ajouter le champ du statut de faim du personnage
    if (character) {
      embed.addFields({
        name: "🍽️ Votre État",
        value: characterHungerStatus,
        inline: false,
      });
    }

    // Préparer les composants (boutons) si nécessaire
    let components: any[] = [];
    if (showEatButton && town.foodStock > 0) {
      const eatButton = new ButtonBuilder()
        .setCustomId('eat_food')
        .setLabel('🍽️ Manger')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(eatButton);

      components = [row];
    }

    await interaction.reply({ embeds: [embed], components, flags: ["Ephemeral"] });
  } catch (error: any) {
    logger.error("Erreur lors de la récupération du stock de foodstock:", {
      guildId: interaction.guildId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    let errorMessage =
      "❌ Une erreur est survenue lors de la récupération du stock de foodstock.";

    if (error.response?.status === 404) {
      errorMessage =
        "❌ Aucune ville trouvée pour ce serveur. Contactez un administrateur.";
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      errorMessage = "❌ Problème d'autorisation. Contactez un administrateur.";
    }

    await interaction.reply({
      content: errorMessage,
      flags: ["Ephemeral"],
    });
  }
}

function getFoodStockColor(stock: number): number {
  if (stock > 100) return 0x00ff00; // Vert - stock élevé
  if (stock > 50) return 0xffff00; // Jaune - stock moyen
  if (stock > 20) return 0xffa500; // Orange - stock faible
  return 0xff0000; // Rouge - stock critique
}

function getFoodStockAdvice(stock: number): string {
  if (stock <= 0) return "🚨 Aucun vivre ! La ville va mourir de faim !";
  if (stock <= 20) return "⚠️ Vivres très faibles, mangez avec parcimonie !";
  if (stock <= 50) return "⚡ Vivres modérées, surveillez la consommation";
  if (stock <= 100)
    return "✅ Vivres correctes, vous pouvez manger normalement";
  return "🌟 Vivres élevées, profitez-en pour faire des réserves !";
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

function getHungerEmoji(level: number): string {
  switch (level) {
    case 0:
      return "😊";
    case 1:
      return "🤤";
    case 2:
      return "😕";
    case 3:
      return "😰";
    case 4:
      return "💀";
    default:
      return "❓";
  }
}
