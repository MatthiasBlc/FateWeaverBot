import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { SeasonService } from '../services/season.service';
import { discordNotificationService } from '../services/discord-notification.service';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

/**
 * Tâche planifiée pour le changement de saison
 * Exécutée tous les lundis à minuit
 */
async function checkAndUpdateSeason() {
  try {
    logger.info('Vérification du changement de saison...');

    const seasonService = new SeasonService(prisma);
    await seasonService.initialize();

    const result = await seasonService.checkAndUpdateSeason();

    if (result.changed && result.newSeason) {
      logger.info(`La saison a changé pour : ${result.newSeason.name}`);

      // Envoyer une notification Discord à tous les guilds configurés
      const guilds = await prisma.guild.findMany({
        where: { logChannelId: { not: null } },
        select: { logChannelId: true, name: true }
      });

      const seasonEmoji = result.newSeason.name === 'SUMMER' ? '☀️' : '❄️';
      let notificationsSent = 0;

      for (const guild of guilds) {
        if (guild.logChannelId) {
          try {
            const sent = await discordNotificationService.sendSeasonChangeNotification(
              guild.logChannelId,
              result.newSeason.name,
              seasonEmoji
            );

            if (sent) {
              notificationsSent++;
              logger.info(`Season change notification sent to ${guild.name}`);
            }
          } catch (error) {
            logger.error(`Failed to send season notification to ${guild.name}:`, { error });
          }
        }
      }

      logger.info(`Season change notifications sent to ${notificationsSent} guilds`);
    } else {
      logger.info('Aucun changement de saison nécessaire');
    }

    return result;
  } catch (error) {
    logger.error('Erreur lors de la vérification du changement de saison :', error);
    throw error;
  }
}

/**
 * Configure et démarre le job de changement de saison
 * @returns L'instance du job CronJob
 */
export function setupSeasonChangeJob(): CronJob {
  // Tous les lundis à minuit (00:00:00)
  const job = new CronJob('0 0 * * 1', async () => {
    try {
      await checkAndUpdateSeason();
    } catch (error) {
      console.error('Erreur lors de l\'exécution du job de changement de saison :', error);
    }
  });
  
  // Démarrer le job
  job.start();
  console.log('Job de changement de saison programmé pour s\'exécuter tous les lundis à minuit');
  
  return job;
}

// Permet d'exécuter ce script directement pour tester
if (require.main === module) {
  console.log('Exécution manuelle de la vérification de saison...');
  checkAndUpdateSeason()
    .then(() => {
      console.log('Vérification de saison terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur lors de la vérification de saison :', error);
      process.exit(1);
    });
}
