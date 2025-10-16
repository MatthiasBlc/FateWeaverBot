import {
  PrismaClient,
  CapabilityCategory,
  SeasonType,
  CapacityBonusType,
} from "@prisma/client";
import { RESOURCES, RESOURCES_EXTENDED } from "../../shared/constants/emojis";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding de la base de données...");

  // Vérifier et créer les capacités si nécessaire
  const existingCapabilities = await prisma.capability.findMany();

  if (existingCapabilities.length === 0) {
    console.log("📝 Création des capacités de base...");

    const capabilities = [
      {
        name: "Chasser",
        emojiTag: "HUNT",
        category: CapabilityCategory.HARVEST,
        costPA: 2,
        description:
          "Chasser du gibier pour obtenir des vivres. Plus efficace en été.",
      },
      {
        name: "Cueillir",
        emojiTag: "GATHER",
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description:
          "Cueillir des plantes comestibles pour obtenir des vivres. Plus efficace en été.",
      },
      {
        name: "Pêcher",
        emojiTag: "FISH",
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description:
          "Pêcher du poisson pour obtenir des Vivres. Peut utiliser 2 PA pour un lancer chanceux.",
      },
      {
        name: "Bûcheronner",
        emojiTag: "CHOPPING",
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description: "Récolter du bois",
      },
      {
        name: "Miner",
        emojiTag: "MINING",
        category: CapabilityCategory.HARVEST,
        costPA: 2,
        description: "Récolter du minerai",
      },
      {
        name: "Tisser",
        emojiTag: "WEAVING",
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: "Multiplier du Bois en Tissu",
      },
      {
        name: "Forger",
        emojiTag: "FORGING",
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: "Multiplier du Minerai en Métal",
      },
      {
        name: "Menuiser",
        emojiTag: "WOODWORKING",
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: "Multiplier du Bois en Planches",
      },
      {
        name: "Cuisiner",
        emojiTag: "COOKING",
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: "Multiplier des Vivres en Repas",
      },
      {
        name: "Soigner",
        emojiTag: "HEALING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Rendre 1 PV à 1 personne OU utiliser 2 PA pour créer 1 Cataplasme",
      },
      {
        name: "Rechercher",
        emojiTag: "RESEARCHING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Analyser un objet/lieu/créature pour obtenir des informations dessus",
      },
      {
        name: "Cartographier",
        emojiTag: "CARTOGRAPHING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Analyser les alentours pour révéler de nouvelles cases sur la carte",
      },
      {
        name: "Auspice",
        emojiTag: "AUGURING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Analyser les cieux pour anticiper la météo des prochains jours",
      },
      {
        name: "Divertir",
        emojiTag: "ENTERTAIN",
        category: CapabilityCategory.SPECIAL,
        costPA: 1,
        description:
          "Divertir le village pour faire regagner des PM. Tous les 5 usages, tout le monde autour gagne 1 PM.",
      },
    ];

    for (const cap of capabilities) {
      await prisma.capability.create({
        data: cap,
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
        name: SeasonType.SUMMER,
      },
    });
    console.log("✅ Saison d'été créée par défaut");
  }

  // Créer les types de ressources par défaut
  const existingResourceTypes = await prisma.resourceType.findMany();
  if (existingResourceTypes.length === 0) {
    console.log("🏗️ Création des types de ressources...");

    const resourceTypes = [
      {
        name: "Vivres",
        emoji: RESOURCES_EXTENDED.BREAD,
        category: "base",
        description: "Ressource brute de survie",
      },
      {
        name: "Bois",
        emoji: RESOURCES.WOOD,
        category: "base",
        description: "Matériau brut",
      },
      {
        name: "Minerai",
        emoji: RESOURCES.MINERAL,
        category: "base",
        description: "Matériau brut",
      },
      {
        name: "Métal",
        emoji: RESOURCES.METAL,
        category: "transformé",
        description: "Produit du minerai",
      },
      {
        name: "Tissu",
        emoji: RESOURCES.FABRIC,
        category: "transformé",
        description: "Produit du bois",
      },
      {
        name: "Planches",
        emoji: RESOURCES.PLANKS,
        category: "transformé",
        description: "Produit du bois",
      },
      {
        name: "Nourriture",
        emoji: RESOURCES.PREPARED_FOOD,
        category: "transformé",
        description: "Produit des vivres",
      },
      {
        name: "Cataplasme",
        emoji: RESOURCES.CATAPLASM,
        category: "science",
        description: "Soin médical (max 3 par ville)",
      },
    ];

    for (const resourceType of resourceTypes) {
      await prisma.resourceType.create({
        data: resourceType,
      });
      console.log(
        `✅ Type de ressource créé : ${resourceType.emoji} ${resourceType.name}`
      );
    }
  } else {
    console.log(
      `✅ ${existingResourceTypes.length} types de ressources déjà présents`
    );
  }

  // Créer un stock de vivres initial pour les villes existantes
  const vivresType = await prisma.resourceType.findFirst({
    where: { name: "Vivres" },
  });
  if (vivresType) {
    const citiesWithoutVivres = await prisma.town.findMany({
      where: {
        resourceStocks: {
          none: {
            resourceTypeId: vivresType.id,
          },
        },
      },
    });

    for (const city of citiesWithoutVivres) {
      await prisma.resourceStock.create({
        data: {
          locationType: "CITY",
          locationId: city.id,
          resourceTypeId: vivresType.id,
          quantity: 50, // Stock initial de vivres
          townId: city.id,
        },
      });
      console.log(
        `✅ Stock initial de vivres créé pour la ville : ${city.name}`
      );
    }
  }

  // Créer les types d'objets
  const existingObjectTypes = await prisma.objectType.findMany();
  if (existingObjectTypes.length === 0) {
    console.log("🎒 Création d'objets...");

    // Récupérer les capacités pour les relations
    const capabilities = await prisma.capability.findMany();
    const getCapId = (emojiTag: string) =>
      capabilities.find((c) => c.emojiTag === emojiTag)?.id || "";

    // 1. Objets simples (sans bonus)
    const simpleObjects = [
      { name: "Coquillage", description: "Coquillage trouvé en pêchant" },
      {
        name: "Appeau",
        description: "Parfait pour attirer les animaux",
      },
      {
        name: "Herbier",
        description: "----",
      },
      { name: "Boussole", description: "----" },
      { name: "Canari", description: "----" },
      {
        name: "Filet",
        description: "----",
      },
      { name: "Somnifère", description: "----" },
      { name: "Bougie", description: "----" },
      { name: "Grenouille", description: "----" },
      { name: "Couronne de fleurs", description: "----" },
    ];

    for (const obj of simpleObjects) {
      await prisma.objectType.create({
        data: obj,
      });
      console.log(`✅ Objet créé : ${obj.name}`);
    }

    // 2. Objets avec bonus de compétence (ObjectSkillBonus)
    const skillBonusObjects = [
      {
        name: "Arc",
        description: "----",
        skills: ["Combat distance"],
      },
      {
        name: "Graines",
        description: "----",
        skills: ["Cultiver"],
      },
      {
        name: "Lanterne",
        description: "----",
        skills: ["Vision nocturne"],
      },
      {
        name: "Matériel de plongée",
        description: "----",
        skills: ["Plonger"],
      },
      { name: "Corde", description: "----", skills: ["Noeuds"] },
      {
        name: "Marteau",
        description: "----",
        skills: ["Réparer"],
      },
      {
        name: "Harnais",
        description: "----",
        skills: ["Porter"],
      },
      {
        name: "Marmite",
        description: "----",
        skills: ["Réconforter"],
      },
      {
        name: "Bottes",
        description: "----",
        skills: ["Déplacement rapide"],
      },
      {
        name: "Fioles",
        description: "----",
        skills: ["Herboristerie"],
      },
      {
        name: "Grimoire vierge",
        description: "----",
        skills: ["Assommer"],
      },
      {
        name: "Longue-vue",
        description: "----",
        skills: ["Vision lointaine"],
      },
      {
        name: "Maquillage",
        description: "----",
        skills: ["Camouflage"],
      },
    ];

    for (const obj of skillBonusObjects) {
      const objectType = await prisma.objectType.create({
        data: {
          name: obj.name,
          description: obj.description,
        },
      });

      // Créer les relations ObjectSkillBonus
      for (const skillTag of obj.skills) {
        const capId = getCapId(skillTag);
        if (capId) {
          await prisma.objectSkillBonus.create({
            data: {
              objectTypeId: objectType.id,
              capabilityId: capId,
            },
          });
        }
      }

      console.log(`✅ Objet avec bonus de compétence créé : ${obj.name}`);
    }

    // 3. Objets avec bonus de capacité (ObjectCapacityBonus)
    const capacityBonusObjects = [
      {
        name: "Couteau de chasse",
        description: "----",
        bonuses: [
          { capabilityTag: "HUNT", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Serpe",
        description: "----",
        bonuses: [
          { capabilityTag: "GATHER", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Pioche",
        description: "----",
        bonuses: [
          { capabilityTag: "MINING", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Nasse",
        description: "----",
        bonuses: [
          { capabilityTag: "FISH", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Sel",
        description: "----",
        bonuses: [
          { capabilityTag: "COOKING", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Bandages",
        description: "----",
        bonuses: [
          { capabilityTag: "HEALING", bonusType: CapacityBonusType.HEAL_EXTRA },
        ],
      },
      {
        name: "instrument",
        description: "----",
        bonuses: [
          {
            capabilityTag: "ENTERTAIN",
            bonusType: CapacityBonusType.ENTERTAIN_BURST,
          },
        ],
      },
      {
        name: "Compas",
        description: "----",
        bonuses: [
          {
            capabilityTag: "CARTOGRAPHING",
            bonusType: CapacityBonusType.ADMIN_INTERPRETED,
          },
        ],
      },
      {
        name: "Loupe",
        description: "----",
        bonuses: [
          {
            capabilityTag: "RESEARCHING",
            bonusType: CapacityBonusType.ADMIN_INTERPRETED,
          },
        ],
      },
      {
        name: "Anémomètre",
        description: "----",
        bonuses: [
          {
            capabilityTag: "AUGURING",
            bonusType: CapacityBonusType.ADMIN_INTERPRETED,
          },
        ],
      },
    ];

    for (const obj of capacityBonusObjects) {
      const objectType = await prisma.objectType.create({
        data: {
          name: obj.name,
          description: obj.description,
        },
      });

      // Créer les relations ObjectCapacityBonus
      for (const bonus of obj.bonuses) {
        const capId = getCapId(bonus.capabilityTag);
        if (capId) {
          await prisma.objectCapacityBonus.create({
            data: {
              objectTypeId: objectType.id,
              capabilityId: capId,
              bonusType: bonus.bonusType,
            },
          });
        }
      }

      console.log(`✅ Objet avec bonus de capacité créé : ${obj.name}`);
    }

    // 4. Objets sac de ressources (ObjectResourceConversion)
    const resourceTypes = await prisma.resourceType.findMany();
    const getResourceId = (name: string) =>
      resourceTypes.find((r) => r.name === name)?.id || 0;

    const resourceBagObjects = [
      {
        name: "planches",
        description: "Se transforme en 20 bois",
        resource: "Bois",
        quantity: 20,
      },
      {
        name: "ferraille",
        description: "Se transforme en 10 minerai",
        resource: "Minerai",
        quantity: 10,
      },
      {
        name: "Jambon",
        description: "Se transforme en 10 vivres",
        resource: "Vivres",
        quantity: 10,
      },
      {
        name: "Sac de tissu",
        description: "Se transforme en 10 tissu",
        resource: "Tissu",
        quantity: 10,
      },
    ];

    for (const obj of resourceBagObjects) {
      const objectType = await prisma.objectType.create({
        data: {
          name: obj.name,
          description: obj.description,
        },
      });

      // Créer la relation ObjectResourceConversion
      const resourceId = getResourceId(obj.resource);
      if (resourceId) {
        await prisma.objectResourceConversion.create({
          data: {
            objectTypeId: objectType.id,
            resourceTypeId: resourceId,
            quantity: obj.quantity,
          },
        });
      }

      console.log(`✅ Objet sac de ressource créé : ${obj.name}`);
    }

    console.log(
      `✅ Total: ${
        simpleObjects.length +
        skillBonusObjects.length +
        capacityBonusObjects.length +
        resourceBagObjects.length
      } objets créés`
    );
  } else {
    console.log(
      `✅ ${existingObjectTypes.length} types d'objets déjà présents`
    );
  }

  // Créer les entrées de loot de pêche
  const existingLootEntries = await prisma.fishingLootEntry.findMany();
  if (existingLootEntries.length === 0) {
    console.log("🎣 Création des tables de loot de pêche...");

    // Table PA 1
    const lootTablePA1 = [
      { paTable: 1, resourceName: "Vivres", quantity: 0, orderIndex: 1 },
      { paTable: 1, resourceName: "Vivres", quantity: 1, orderIndex: 2 },
      { paTable: 1, resourceName: "Vivres", quantity: 1, orderIndex: 3 },
      { paTable: 1, resourceName: "Vivres", quantity: 1, orderIndex: 4 },
      { paTable: 1, resourceName: "Vivres", quantity: 1, orderIndex: 5 },
      { paTable: 1, resourceName: "bois", quantity: 2, orderIndex: 6 },
      { paTable: 1, resourceName: "bois", quantity: 2, orderIndex: 7 },
      { paTable: 1, resourceName: "minerai", quantity: 2, orderIndex: 8 },
      { paTable: 1, resourceName: "minerai", quantity: 2, orderIndex: 9 },
      { paTable: 1, resourceName: "Vivres", quantity: 2, orderIndex: 10 },
      { paTable: 1, resourceName: "Vivres", quantity: 2, orderIndex: 11 },
      { paTable: 1, resourceName: "Vivres", quantity: 2, orderIndex: 12 },
      { paTable: 1, resourceName: "Vivres", quantity: 3, orderIndex: 13 },
      { paTable: 1, resourceName: "Vivres", quantity: 3, orderIndex: 14 },
      { paTable: 1, resourceName: "Vivres", quantity: 3, orderIndex: 15 },
      { paTable: 1, resourceName: "Vivres", quantity: 4, orderIndex: 16 },
      { paTable: 1, resourceName: "Vivres", quantity: 4, orderIndex: 17 },
    ];

    // Table PA 2 (avec coquillage)
    const lootTablePA2 = [
      { paTable: 2, resourceName: "Vivres", quantity: 1, orderIndex: 1 },
      { paTable: 2, resourceName: "Vivres", quantity: 2, orderIndex: 2 },
      { paTable: 2, resourceName: "Vivres", quantity: 2, orderIndex: 3 },
      { paTable: 2, resourceName: "Vivres", quantity: 2, orderIndex: 4 },
      { paTable: 2, resourceName: "Vivres", quantity: 2, orderIndex: 5 },
      { paTable: 2, resourceName: "bois", quantity: 4, orderIndex: 6 },
      { paTable: 2, resourceName: "minerai", quantity: 4, orderIndex: 7 },
      { paTable: 2, resourceName: "Vivres", quantity: 3, orderIndex: 8 },
      { paTable: 2, resourceName: "Vivres", quantity: 3, orderIndex: 9 },
      { paTable: 2, resourceName: "Vivres", quantity: 3, orderIndex: 10 },
      { paTable: 2, resourceName: "Vivres", quantity: 3, orderIndex: 11 },
      { paTable: 2, resourceName: "bois", quantity: 6, orderIndex: 12 },
      { paTable: 2, resourceName: "minerai", quantity: 5, orderIndex: 13 },
      { paTable: 2, resourceName: "Vivres", quantity: 5, orderIndex: 14 },
      { paTable: 2, resourceName: "Vivres", quantity: 5, orderIndex: 15 },
      { paTable: 2, resourceName: "Vivres", quantity: 10, orderIndex: 16 },
      { paTable: 2, resourceName: "Coquillage", quantity: 1, orderIndex: 17 },
    ];

    for (const entry of [...lootTablePA1, ...lootTablePA2]) {
      await prisma.fishingLootEntry.create({
        data: entry,
      });
    }

    console.log(
      `✅ ${
        lootTablePA1.length + lootTablePA2.length
      } entrées de loot de pêche créées`
    );
  } else {
    console.log(
      `✅ ${existingLootEntries.length} entrées de loot de pêche déjà présentes`
    );
  }

  console.log("🎉 Seeding terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
