import { PrismaClient, CapabilityCategory, SeasonType } from '@prisma/client';
import { RESOURCES, RESOURCES_EXTENDED } from '../../shared/constants/emojis';

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
        emojiTag: 'HUNT',
        category: CapabilityCategory.HARVEST,
        costPA: 2,
        description: 'Chasser du gibier pour obtenir des vivres. Plus efficace en été.'
      },
      {
        name: 'Cueillir',
        emojiTag: 'GATHER',
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description: 'Cueillir des plantes comestibles pour obtenir des vivres. Plus efficace en été.'
      },
      {
        name: 'Pêcher',
        emojiTag: 'FISH',
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description: 'Pêcher du poisson pour obtenir des Vivres. Peut utiliser 2 PA pour un lancer chanceux.'
      },
      {
        name: 'Bûcheronner',
        emojiTag: 'CHOPPING',
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description: 'Récolter du bois'
      },
      {
        name: 'Miner',
        emojiTag: 'MINING',
        category: CapabilityCategory.HARVEST,
        costPA: 2,
        description: 'Récolter du minerai'
      },
      {
        name: 'Tisser',
        emojiTag: 'WEAVING',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Multiplier du Bois en Tissu'
      },
      {
        name: 'Forger',
        emojiTag: 'FORGING',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Multiplier du Minerai en Métal'
      },
      {
        name: 'Travailler le bois',
        emojiTag: 'WOODWORKING',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Multiplier du Bois en Planches'
      },
      {
        name: 'Cuisiner',
        emojiTag: 'COOKING',
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: 'Multiplier des Vivres en Repas'
      },
      {
        name: 'Soigner',
        emojiTag: 'HEALING',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: 'Rendre 1 PV à 1 personne OU utiliser 2 PA pour créer 1 Cataplasme'
      },
      {
        name: 'Rechercher',
        emojiTag: 'RESEARCHING',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: 'Analyser un objet/lieu/créature pour obtenir des informations dessus'
      },
      {
        name: 'Cartographier',
        emojiTag: 'CARTOGRAPHING',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: 'Analyser les alentours pour révéler de nouvelles cases sur la carte'
      },
      {
        name: 'Auspice',
        emojiTag: 'AUGURING',
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description: 'Analyser les cieux pour anticiper la météo des prochains jours'
      },
      {
        name: 'Divertir',
        emojiTag: 'ENTERTAIN',
        category: CapabilityCategory.SPECIAL,
        costPA: 1,
        description: 'Divertir le village pour faire regagner des PM. Tous les 5 usages, tout le monde autour gagne 1 PM.'
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
      { name: "Vivres", emoji: RESOURCES_EXTENDED.BREAD, category: "base", description: "Ressource brute de survie" },
      { name: "Bois", emoji: RESOURCES.WOOD, category: "base", description: "Matériau brut" },
      { name: "Minerai", emoji: RESOURCES.MINERAL, category: "base", description: "Matériau brut" },
      { name: "Métal", emoji: RESOURCES.METAL, category: "transformé", description: "Produit du minerai" },
      { name: "Tissu", emoji: RESOURCES.FABRIC, category: "transformé", description: "Produit du bois" },
      { name: "Planches", emoji: RESOURCES.PLANKS, category: "transformé", description: "Produit du bois" },
      { name: "Nourriture", emoji: RESOURCES.PREPARED_FOOD, category: "transformé", description: "Produit des vivres" },
      { name: "Cataplasme", emoji: RESOURCES.CATAPLASM, category: "science", description: "Soin médical (max 3 par ville)" },
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
