import { CronJob } from "cron";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { logger } from "../services/logger.js";
import { apiService } from "../services/api/index.js";
import { config } from "../config/index.js";

/**
 * Vérifie et notifie les changements de saison
 * S'exécute tous les lundis à 00:00:00 (début de semaine)
 */
export function setupSeasonChangeJob(client: Client) {
  const job = new CronJob(
    "0 0 * * 1", // Every Monday at 00:00:00
    async () => {
      try {
        logger.info("Checking for season changes at Monday 00:00:00");

        // Vérifier si la saison a changé via l'API backend
        const baseUrl = config.api.baseUrl;
        const seasonCheckResponse = await fetch(`${baseUrl}/api/seasons/check-change`)
          .then(r => r.json())
          .catch((error) => {
            logger.error("Failed to check season change:", { error });
            return { changed: false };
          });

        // Si pas de changement, arrêter ici
        if (!seasonCheckResponse.changed) {
          logger.info("No season change detected");
          return;
        }

        logger.info("Season change detected!", {
          oldSeason: seasonCheckResponse.oldSeason,
          newSeason: seasonCheckResponse.newSeason,
        });

        // Récupérer toutes les guildes pour envoyer les notifications
        const guilds = await apiService.guilds.getAllGuilds();

        let sentCount = 0;

        for (const guild of guilds) {
          try {
            // Vérifier qu'un canal est configuré (utiliser dailyMessageChannelId en priorité, sinon logChannelId)
            const channelId = guild.dailyMessageChannelId || guild.logChannelId;
            if (!channelId) {
              logger.debug(`Guild ${guild.name} has no notification channel configured, skipping`);
              continue;
            }

            // Vérifier que le bot est dans ce serveur Discord
            const discordGuild = client.guilds.cache.get(guild.discordGuildId);
            if (!discordGuild) {
              logger.warn(`Bot is not in guild ${guild.name} (${guild.discordGuildId}), skipping`);
              continue;
            }

            // Récupérer le canal
            const channel = await client.channels.fetch(channelId);
            if (!channel || !(channel instanceof TextChannel)) {
              logger.warn(`Notification channel ${channelId} not found or not a text channel for guild ${guild.name}`);
              continue;
            }

            // Récupérer la ville associée
            if (!guild.town) {
              logger.warn(`No town found for guild ${guild.name}, skipping`);
              continue;
            }

            // Créer l'embed selon la nouvelle saison
            const seasonData = seasonCheckResponse.newSeason;
            const seasonEmoji = getSeasonEmoji(seasonData.name);
            const seasonColor = getSeasonColor(seasonData.name);

            const embed = new EmbedBuilder()
              .setTitle(`${seasonEmoji} Changement de Saison !`)
              .setDescription(`La saison **${seasonData.name}** commence dans ${guild.town.name} !`)
              .setColor(seasonColor)
              .addFields(
                {
                  name: "🌡️ Température",
                  value: `${seasonData.temperature}°C`,
                  inline: true,
                },
                {
                  name: "🌧️ Précipitations",
                  value: `${seasonData.precipitation}%`,
                  inline: true,
                },
                {
                  name: "📜 Description",
                  value: seasonData.description || "Une nouvelle saison commence...",
                  inline: false,
                }
              )
              .setTimestamp()
              .setFooter({ text: "FateWeaver Bot" });

            // Envoyer le message
            await channel.send({ embeds: [embed] });

            logger.info(`Season change notification sent to ${guild.name} (${channel.name})`);
            sentCount++;
          } catch (error) {
            logger.error(`Failed to send season change notification for guild ${guild.name}:`, { error });
          }
        }

        logger.info(`Season change notifications sent to ${sentCount} guilds`);
      } catch (error) {
        logger.error("Error in season change cron job:", { error });
      }
    },
    null, // onComplete
    true, // start immediately
    "Europe/Paris" // timezone
  );

  logger.info("Season change job scheduled for Monday 00:00:00 (Europe/Paris)");

  return job;
}

/**
 * Retourne l'emoji correspondant à une saison
 */
function getSeasonEmoji(seasonName: string): string {
  const emojis: Record<string, string> = {
    "Printemps": "🌸",
    "Été": "☀️",
    "Automne": "🍂",
    "Hiver": "❄️",
  };
  return emojis[seasonName] || "🌍";
}

/**
 * Retourne la couleur Discord correspondant à une saison
 */
function getSeasonColor(seasonName: string): number {
  const colors: Record<string, number> = {
    "Printemps": 0x90EE90, // Light green
    "Été": 0xFFD700,       // Gold
    "Automne": 0xFF8C00,   // Dark orange
    "Hiver": 0x87CEEB,     // Sky blue
  };
  return colors[seasonName] || 0x5865F2; // Discord blurple as default
}
