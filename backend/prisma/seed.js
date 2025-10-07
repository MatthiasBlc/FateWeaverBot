"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding de la base de données...');
    // Vérifier et créer les capacités si nécessaire
    const existingCapabilities = await prisma.capability.findMany();
    if (existingCapabilities.length === 0) {
        console.log('📝 Création des capacités de base...');
        const capabilities = [
            {
                name: 'Chasser',
                category: client_1.CapabilityCategory.HARVEST,
                costPA: 2,
                description: 'Chasser du gibier pour obtenir des vivres. Plus efficace en été.'
            },
            {
                name: 'Cueillir',
                category: client_1.CapabilityCategory.HARVEST,
                costPA: 1,
                description: 'Cueillir des baies et des plantes comestibles. Plus efficace en été.'
            },
            {
                name: 'Pêcher',
                category: client_1.CapabilityCategory.HARVEST,
                costPA: 1,
                description: 'Pêcher du poisson. Peut utiliser 2 PA pour un lancer chanceux.'
            },
            {
                name: 'Divertir',
                category: client_1.CapabilityCategory.SPECIAL,
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
    }
    else {
        console.log(`✅ ${existingCapabilities.length} capacités déjà présentes`);
    }
    // Créer une saison par défaut si elle n'existe pas
    const existingSeason = await prisma.season.findFirst();
    if (!existingSeason) {
        await prisma.season.upsert({
            where: { id: 1 },
            update: {},
            create: {
                name: client_1.SeasonType.SUMMER
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
        ];
        for (const resourceType of resourceTypes) {
            await prisma.resourceType.create({
                data: resourceType
            });
            console.log(`✅ Type de ressource créé : ${resourceType.emoji} ${resourceType.name}`);
        }
    }
    else {
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
                    quantity: 100,
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
