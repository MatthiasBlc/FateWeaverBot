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
        name: 'Bûcheronner',
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description: 'Récolte 2-3 bois'
      },
      {
        name: 'Miner',
        category: CapabilityCategory.HARVEST,
        costPA: 2,
        description: 'Récolte 2-6 minerai'
      },
      {
        name: 'Tisser',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Bois → Tissu (formule aléatoire)'
      },
      {
        name: 'Forger',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Minerai → Fer (formule aléatoire)'
      },
      {
        name: 'Travailler le bois',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Bois → Planches (formule aléatoire)'
      },
      {
        name: 'Cuisiner',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Vivres → Nourriture (formule aléatoire)'
      },
      {
        name: 'Soigner',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: '1 PA = +1 PV cible, 2 PA = 1 cataplasme'
      },
      {
        name: 'Analyser',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: 'Recherche (admin)'
      },
      {
        name: 'Cartographier',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: 'Exploration (admin)'
      },
      {
        name: 'Auspice',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: 'Divination (admin)'
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

  // Créer les types de ressources par défaut
  const existingResourceTypes = await prisma.resourceType.findMany();
  if (existingResourceTypes.length === 0) {
    console.log('🏗️ Création des types de ressources...');

    const resourceTypes = [
      { name: "Vivres", emoji: "🍞", category: "base", description: "Ressource brute de survie" },
      { name: "Bois", emoji: "🌲", category: "base", description: "Matériau brut" },
      { name: "Minerai", emoji: "⛏️", category: "base", description: "Matériau brut" },
      { name: "Métal", emoji: "⚙️", category: "transformé", description: "Produit du minerai" },
      { name: "Tissu", emoji: "🧵", category: "transformé", description: "Produit du bois" },
      { name: "Planches", emoji: "🪵", category: "transformé", description: "Produit du bois" },
      { name: "Nourriture", emoji: "🍖", category: "transformé", description: "Produit des vivres" },
      { name: "Cataplasme", emoji: "🩹", category: "science", description: "Soin médical (max 3 par ville)" },
    ];

    for (const resourceType of resourceTypes) {
      await prisma.resourceType.create({
        data: resourceType
      });
      console.log(`✅ Type de ressource créé : ${resourceType.emoji} ${resourceType.name}`);
    }
  } else {
    console.log(`✅ ${existingResourceTypes.length} types de ressources déjà présents`);
  }

  // Créer un stock de vivres initial pour les villes existantes
  const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });
  if (vivresType) {
    const citiesWithoutVivres = await prisma.town.findMany({
      where: {
        resourceStocks: {
          none: {
            resourceTypeId: vivresType.id
          }
        }
      }
    });

    for (const city of citiesWithoutVivres) {
      await prisma.resourceStock.create({
        data: {
          locationType: "CITY",
          locationId: city.id,
          resourceTypeId: vivresType.id,
          quantity: 100, // Stock initial de vivres
          townId: city.id
        }
      });
      console.log(`✅ Stock initial de vivres créé pour la ville : ${city.name}`);
    }
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
