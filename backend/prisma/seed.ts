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
          "Chasser du gibier pour obtenir des vivres.",
      },
      {
        name: "Cueillir",
        emojiTag: "GATHER",
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description:
          "Cueillir des plantes comestibles pour obtenir des vivres.",
      },
      {
        name: "Pêcher",
        emojiTag: "FISH",
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description:
          "Pêcher du poisson pour obtenir des Vivres.",
      },
      {
        name: "Couper du bois",
        emojiTag: "CHOPPING",
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description: "Récolter du bois.",
      },
      {
        name: "Miner",
        emojiTag: "MINING",
        category: CapabilityCategory.HARVEST,
        costPA: 2,
        description: "Récolter du minerai.",
      },
      {
        name: "Cuisiner",
        emojiTag: "COOKING",
        category: CapabilityCategory.HARVEST,
        costPA: 1,
        description: "Multiplier des Vivres en Repas.",
      },
      {
        name: "Tisser",
        emojiTag: "WEAVING",
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: "Concevoir des projets de tissage.",
      },
      {
        name: "Forger",
        emojiTag: "FORGING",
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: "Concevoir des projets de forge.",
      },
      {
        name: "Travailler le bois",
        emojiTag: "WOODWORKING",
        category: CapabilityCategory.CRAFT,
        costPA: 1,
        description: "Concevoir des projets de menuiserie.",
      },
      {
        name: "Soigner",
        emojiTag: "HEALING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Soigner 1 personnage.",
      },
      {
        name: "Rechercher",
        emojiTag: "RESEARCHING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Analyser un objet/lieu/créature pour obtenir des informations dessus.",
      },
      {
        name: "Cartographier",
        emojiTag: "CARTOGRAPHING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Analyser les alentours pour révéler de nouvelles cases sur la carte.",
      },
      {
        name: "Auspice",
        emojiTag: "AUGURING",
        category: CapabilityCategory.SCIENCE,
        costPA: 1,
        description:
          "Analyser les cieux pour anticiper la météo des prochains jours.",
      },
      {
        name: "Divertir",
        emojiTag: "ENTERTAIN",
        category: CapabilityCategory.SPECIAL,
        costPA: 1,
        description:
          "Divertir le village pour faire regagner des PM.",
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

  // Créer les métiers si nécessaire
  const existingJobs = await prisma.job.findMany();

  if (existingJobs.length === 0) {
    console.log("💼 Création des métiers de base...");

    const jobsData = [
      { name: "Chasseuse", startingAbility: "Chasser", description: " " },
      { name: "Cueilleur", startingAbility: "Cueillir", description: " " },
      { name: "Pêcheur", startingAbility: "Pêcher", description: " " },
      { name: "Mineuse", startingAbility: "Miner", description: " " },
      { name: "Tisserand", startingAbility: "Tisser", description: " " },
      { name: "Forgeronne", startingAbility: "Forger", description: " " },
      { name: "Menuisier", startingAbility: "Menuiser", description: " " },
      { name: "Cuisinière", startingAbility: "Cuisiner", description: " " },
      { name: "Guérisseur", startingAbility: "Soigner", description: " " },
      { name: "Érudit", startingAbility: "Rechercher", description: " " },
      { name: "Cartographe", startingAbility: "Cartographier", description: " " },
      { name: "Météorologue", startingAbility: "Auspice", description: " " },
      { name: "Artiste", startingAbility: "Divertir", description: " " },
    ];

    for (const jobData of jobsData) {
      const startingAbility = await prisma.capability.findUnique({
        where: { name: jobData.startingAbility },
      });

      if (!startingAbility) {
        console.error(`❌ Capacité "${jobData.startingAbility}" introuvable pour le métier ${jobData.name}`);
        continue;
      }

      await prisma.job.create({
        data: {
          name: jobData.name,
          description: jobData.description,
          startingAbilityId: startingAbility.id,
          optionalAbilityId: null,
        },
      });
      console.log(`✅ Métier créé : ${jobData.name} (${jobData.startingAbility})`);
    }
  } else {
    console.log(`✅ ${existingJobs.length} métiers déjà présents`);
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
        emoji: RESOURCES.FOOD,
        category: "base",
        description: "Ressource comestible et utilisable pour survivre",
      },
      {
        name: "Bois",
        emoji: RESOURCES.WOOD,
        category: "base",
        description: "Des morceaux d'arbre",
      },
      {
        name: "Minerai",
        emoji: RESOURCES.MINERAL,
        category: "base",
        description: "Extraits d'un filon minier",
      },
      {
        name: "Tissu",
        emoji: RESOURCES.FABRIC,
        category: "transformé",
        description: " ",
      },
      {
        name: "Repas",
        emoji: RESOURCES.PREPARED_FOOD,
        category: "transformé",
        description: "Un bon repas",
      },
      {
        name: "Cataplasme",
        emoji: RESOURCES.CATAPLASM,
        category: "science",
        description: "Bandages à emporter",
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
          quantity: 20, // Stock initial de vivres
          townId: city.id,
        },
      });
      console.log(
        `✅ Stock initial de vivres créé pour la ville : ${city.name}`
      );
    }
  }

  // Créer les compétences (skills)
  const existingSkills = await prisma.skill.findMany();
  if (existingSkills.length === 0) {
    console.log("🎯 Création des compétences (skills)...");

    const skills = [
      { name: "Combat distance", description: "Attaquer à distance" },
      { name: "Cultiver", description: "Cultiver des plantes" },
      { name: "Vision nocturne", description: "Voir dans l'obscurité" },
      { name: "Plonger", description: "Plonger en profondeur" },
      { name: "Noeuds", description: "Maîtrise des nœuds" },
      { name: "Réparer", description: "Réparer des objets" },
      { name: "Porter", description: "Porter de lourdes charges" },
      // { name: "Réconforter", description: "Réconforter les autres" },
      { name: "Déplacement rapide", description: "Se déplacer rapidement" },
      { name: "Herboristerie", description: "Connaissance des plantes" },
      { name: "Assommer", description: "Assommer un adversaire" },
      { name: "Vision lointaine", description: "Vue perçante" },
      { name: "Camouflage", description: "Se camoufler" },
      { name: "Apprivoisement", description: "Apprivoiser une créature" },
      { name: "Pistage", description: "Suivre une piste" },
      { name: "Pièges", description: "Créer et déjouer des pièges" },
      { name: "Orientation", description: "Trouver son chemin" },
      { name: "Escalader", description: "Savoir grimper" },
      { name: "Balisage", description: "Marquer un chemin pour se repérer" },
      { name: "Discrétion", description: "Se déplacer sans bruit" },
      { name: "Communiquer", description: "Savoir s'exprimer et échanger" },
    ];

    for (const skill of skills) {
      await prisma.skill.create({
        data: skill,
      });
      console.log(`✅ Compétence créée : ${skill.name}`);
    }
  } else {
    console.log(`✅ ${existingSkills.length} compétences déjà présentes`);
  }

  // Créer les types d'objets
  const existingObjectTypes = await prisma.objectType.findMany();
  if (existingObjectTypes.length === 0) {
    console.log("🎒 Création d'objets...");

    // Récupérer les capacités pour les relations
    const capabilities = await prisma.capability.findMany();
    const getCapId = (emojiTag: string) =>
      capabilities.find((c) => c.emojiTag === emojiTag)?.id || "";

    // Récupérer les skills pour les relations
    const skills = await prisma.skill.findMany();
    const getSkillId = (name: string) =>
      skills.find((s) => s.name === name)?.id || "";

    // 1. Objets simples (sans bonus)
    const simpleObjects = [
      { name: "Coquillage", description: "On entend la mer" },
      {
        name: "Appeau",
        description: "Petit, petit, petit...",
      },
      {
        name: "Herbier",
        description: "De jolis dessins descriptifs",
      },
      { name: "Boussole", description: "Elle ne perd jamais le nord, elle !" },
      { name: "Canari", description: "S'il cesse de chanter... fuyez !" },
      {
        name: "Filet",
        description: "Qui sait ce qui peut s'y prendre ?",
      },
      { name: "Somnifère", description: "Toujours utile" },
      { name: "Bougie", description: "Pour y voir un peu mieux" },
      { name: "Grenouille", description: "Elle monte... et elle redescend" },
      { name: "Couronne de fleurs", description: "Création féérique" },
      { name: "Codex sacré", description: "Paroles, paroles, paroles (mais sacrées !)" },
      { name: "Nécessaire d'écriture", description: "Indispensable à tout érudit" },
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
        description: "Une arme redoutable",
        skills: ["Combat distance"],
      },
      {
        name: "Graines",
        description: "Qui sème une graine, récolte la tempête",
        skills: ["Cultiver"],
      },
      {
        name: "Lanterne",
        description: "Un phare dans l'obscurité",
        skills: ["Vision nocturne"],
      },
      {
        name: "Matériel de plongée",
        description: "Le tuba de l'été !",
        skills: ["Plonger"],
      },
      { name: "Corde", description: "Quitte à vivre en hauteur, c'est mieux que de se pendre", skills: ["Noeuds"] },
      {
        name: "Marteau",
        description: "Je cognerais le jour !",
        skills: ["Réparer"],
      },
      {
        name: "Harnais",
        description: "Pourquoi c'est toujours moi qui porte ?",
        skills: ["Porter"],
      },
      {
        name: "Marmite",
        description: "Ne pas tomber dedans quand on est petit",
        skills: ["Réconforter"],
      },
      {
        name: "Bottes",
        description: "Probablement piquées à un chat",
        skills: ["Déplacement rapide"],
      },
      {
        name: "Fioles",
        description: "Pour adoucir le mélange, pressez trois quartiers d'orange",
        skills: ["Herboristerie"],
      },
      {
        name: "Grimoire vierge",
        description: "Un texte assommant",
        skills: ["Assommer"],
      },
      {
        name: "Longue-vue",
        description: "Au royaume des aveugles, les longues vues sont reines",
        skills: ["Vision lointaine"],
      },
      {
        name: "Maquillage",
        description: "Touche finale, bouche fatale",
        skills: ["Camouflage"],
      },
      {
        name: "Collets",
        description: "Attrapez les tous !",
        skills: ["Pièges"],
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
      for (const skillName of obj.skills) {
        const skillId = getSkillId(skillName);
        if (skillId) {
          await prisma.objectSkillBonus.create({
            data: {
              objectTypeId: objectType.id,
              skillId: skillId,
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
        description: "Le couteau le plus affûté du tiroir",
        bonuses: [
          { capabilityTag: "HUNT", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Serpe",
        description: "En or, sinon rien",
        bonuses: [
          { capabilityTag: "GATHER", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Pioche",
        description: "Quoi, ma tête ? Qu'est-ce qu'elle a ma tête ?",
        bonuses: [
          { capabilityTag: "MINING", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Nasse",
        description: "Stockage en baie peu profonde",
        bonuses: [
          { capabilityTag: "FISH", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Quenouille",
        description: "Gare à l'endormissement !",
        bonuses: [
          { capabilityTag: "WEAVING", bonusType: CapacityBonusType.ADMIN_INTERPRETED },
        ],
      },
      {
        name: "Enclume",
        description: "Entre le marteau et elle...",
        bonuses: [
          { capabilityTag: "FORGING", bonusType: CapacityBonusType.ADMIN_INTERPRETED },
        ],
      },
      {
        name: "Scie",
        description: "Avec des scies, on mettrait l'île en bouteille",
        bonuses: [
          { capabilityTag: "WOODWORKING", bonusType: CapacityBonusType.ADMIN_INTERPRETED },
        ],
      },
      {
        name: "Sel",
        description: "À ne pas déverser n'importe où !",
        bonuses: [
          { capabilityTag: "COOKING", bonusType: CapacityBonusType.LUCKY_ROLL },
        ],
      },
      {
        name: "Traité de Médecine",
        description: "Un corps de texte anatomique",
        bonuses: [
          { capabilityTag: "HEALING", bonusType: CapacityBonusType.HEAL_EXTRA },
        ],
      },

      {
        name: "Compas",
        description: "Con et passion font Compas-sion",
        bonuses: [
          {
            capabilityTag: "CARTOGRAPHING",
            bonusType: CapacityBonusType.ADMIN_INTERPRETED,
          },
        ],
      },
      {
        name: "Loupe",
        description: "Élémentaire.",
        bonuses: [
          {
            capabilityTag: "RESEARCHING",
            bonusType: CapacityBonusType.ADMIN_INTERPRETED,
          },
        ],
      },
      {
        name: "Anémomètre",
        description: "Pas de risque de se prendre un vent",
        bonuses: [
          {
            capabilityTag: "AUGURING",
            bonusType: CapacityBonusType.ADMIN_INTERPRETED,
          },
        ],
      },
      {
        name: "Violon",
        description: "Qui fait danser les filles et les garçons",
        bonuses: [
          {
            capabilityTag: "ENTERTAIN",
            bonusType: CapacityBonusType.ENTERTAIN_BURST,
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
        name: "Lingots",
        description: "D'une valeur de 10 minerais",
        resource: "Minerai",
        quantity: 10,
      },
      {
        name: "Jambon",
        description: "D'une valeur de 10 vivres",
        resource: "Vivres",
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
      `✅ Total: ${simpleObjects.length +
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
      `✅ ${lootTablePA1.length + lootTablePA2.length
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
