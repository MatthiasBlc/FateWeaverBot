import { PrismaClient, CapabilityCategory } from '@prisma/client';
import { logger } from '../src/services/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Début de l\'initialisation des capacités...');

  // Vérifier si des capacités existent déjà
  const existingCapabilities = await prisma.capability.findMany();
  
  if (existingCapabilities.length > 0) {
    logger.info('Des capacités existent déjà, suppression...');
    await prisma.characterCapability.deleteMany({});
    await prisma.capability.deleteMany({});
  }

  // Créer les capacités de base
  const capabilities = [
    {
      name: 'Chasser',
      category: CapabilityCategory.HARVEST,
      costPA: 2,
      description: 'Chasser du gibier pour obtenir des vivres. Plus efficace en été.'
    },
    {
      name: 'Cueillir',
      category: CapabilityCategory.HARVEST,
      costPA: 1,
      description: 'Cueillir des baies et des plantes comestibles. Plus efficace en été.'
    },
    {
      name: 'Pêcher',
      category: CapabilityCategory.HARVEST,
      costPA: 1, // Peut être doublé pour un lucky roll
      description: 'Pêcher du poisson. Peut utiliser 2 PA pour un lancer chanceux.'
    },
    {
      name: 'Divertir',
      category: CapabilityCategory.SPECIAL,
      costPA: 1,
      description: 'Divertir la ville. Tous les 5 usages, tout le monde gagne 1 PM (max 5).'
    }
  ];

  // Insérer les capacités
  for (const cap of capabilities) {
    await prisma.capability.create({
      data: cap
    });
    logger.info(`Capacité créée : ${cap.name}`);
  }

  logger.info('Initialisation des capacités terminée avec succès !');
}

main()
  .catch((e) => {
    logger.error('Erreur lors de l\'initialisation des capacités :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
