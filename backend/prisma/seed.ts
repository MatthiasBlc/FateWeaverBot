import { PrismaClient, CapabilityCategory, SeasonType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding de la base de données...');

  // Vérifier et créer les capacités si nécessaire
  const existingCapabilities = await prisma.capability.findMany();

  if (existingCapabilities.length === 0) {
    console.log('📝 Création des capacités de base...');

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
        costPA: 1,
        description: 'Pêcher du poisson. Peut utiliser 2 PA pour un lancer chanceux.'
      },
      {
        name: 'Divertir',
        category: CapabilityCategory.SPECIAL,
        costPA: 1,
        description: 'Divertir la ville. Tous les 5 usages, tout le monde gagne 1 PM (max 5).'
      }
    ];

    for (const cap of capabilities) {
      await prisma.capability.create({
        data: cap
      });
      console.log(`✅ Capacité créée : ${cap.name}`);
    }
  } else {
    console.log(`✅ ${existingCapabilities.length} capacités déjà présentes`);
  }

  // Créer une saison par défaut si elle n'existe pas
  const existingSeason = await prisma.season.findFirst();
  if (!existingSeason) {
    await prisma.season.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: SeasonType.SUMMER
      }
    });
    console.log('✅ Saison d\'été créée par défaut');
  }

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
