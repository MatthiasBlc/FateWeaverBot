import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { SeasonService } from '../services/season.service';
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
      // Pas de notification Discord pour les changements automatiques
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
