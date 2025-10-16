import { CronJob } from "cron";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { logger } from "../services/logger.js";
import { apiService } from "../services/api/index.js";
import { config } from "../config/index.js";

/**
 * Envoie les messages quotidiens à tous les guilds configurés
 * S'exécute à 08:00:05 chaque jour (après le traitement des expéditions à 08:00:00)
 */
export function setupDailyMessagesJob(client: Client) {
  const job = new CronJob(
    "5 8 * * *", // 08:00:05 every day
    async () => {
      try {
        logger.info("Starting daily message broadcast at 08:00:05");

        // Récupérer toutes les guildes
        const guilds = await apiService.guilds.getAllGuilds();

        let sentCount = 0;

        for (const guild of guilds) {
          try {
            // Vérifier qu'un canal de messages quotidiens est configuré
            if (!guild.dailyMessageChannelId) {
              logger.debug(`Guild ${guild.name} has no daily message channel configured, skipping`);
              continue;
            }

            // Vérifier que le bot est dans ce serveur Discord
            const discordGuild = client.guilds.cache.get(guild.discordGuildId);
            if (!discordGuild) {
              logger.warn(`Bot is not in guild ${guild.name} (${guild.discordGuildId}), skipping`);
              continue;
            }

            // Récupérer le canal
            const channel = await client.channels.fetch(guild.dailyMessageChannelId);
            if (!channel || !(channel instanceof TextChannel)) {
              logger.warn(`Daily message channel ${guild.dailyMessageChannelId} not found or not a text channel for guild ${guild.name}`);
              continue;
            }

            // Récupérer la ville associée
            if (!guild.town) {
              logger.warn(`No town found for guild ${guild.name}, skipping`);
              continue;
            }

            const townId = guild.town.id;

            // Récupérer les données pour le message quotidien via l'API backend
            const baseUrl = config.api.baseUrl;
            const [weatherResponse, actionsResponse, stocksResponse, expeditionsResponse] = await Promise.all([
              fetch(`${baseUrl}/api/towns/${townId}/weather`).then(r => r.json()).catch(() => ({ weather: "Information non disponible" })),
              fetch(`${baseUrl}/api/towns/${townId}/actions-recap`).then(r => r.json()).catch(() => ({ recap: "Aucune activité notable" })),
              fetch(`${baseUrl}/api/towns/${townId}/stocks-summary`).then(r => r.json()).catch(() => ({ summary: "Aucune ressource en stock" })),
              fetch(`${baseUrl}/api/towns/${townId}/expeditions-summary`).then(r => r.json()).catch(() => ({ summary: "Aucun mouvement d'expédition" }))
            ]);

            const weather = weatherResponse.weather || "Information non disponible";
            const actions = actionsResponse.recap || "Aucune activité notable";
            const stocks = stocksResponse.summary || "Aucune ressource en stock";
            const expeditions = expeditionsResponse.summary || "Aucun mouvement d'expédition";

            // Créer l'embed
            const embed = new EmbedBuilder()
              .setTitle(`🌅 Bulletin quotidien - ${guild.town.name}`)
              .setColor(0xFFA500) // Orange
              .addFields(
                {
                  name: "🌤️ Météo",
                  value: weather,
                  inline: false,
                },
                {
                  name: "📜 Activités d'hier",
                  value: actions,
                  inline: false,
                },
                {
                  name: "📦 Stocks actuels",
                  value: stocks,
                  inline: false,
                },
                {
                  name: "🏕️ Expéditions",
                  value: expeditions,
                  inline: false,
                }
              )
              .setTimestamp()
              .setFooter({ text: "FateWeaver Bot" });

            // Envoyer le message
            await channel.send({ embeds: [embed] });

            logger.info(`Daily message sent to ${guild.name} (${channel.name})`);
            sentCount++;
          } catch (error) {
            logger.error(`Failed to send daily message for guild ${guild.name}:`, { error });
          }
        }

        logger.info(`Daily messages sent to ${sentCount} guilds`);
      } catch (error) {
        logger.error("Error in daily messages cron job:", { error });
      }
    },
    null, // onComplete
    true, // start immediately
    "Europe/Paris" // timezone
  );

  logger.info("Daily messages job scheduled for 08:00:05 daily (Europe/Paris)");

  return job;
}
