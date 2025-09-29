import { EmbedBuilder, type GuildMember } from "discord.js";
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

    await interaction.reply({ embeds: [embed] });
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
