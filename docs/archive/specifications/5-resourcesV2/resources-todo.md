# Migration multi-ressources (V1)

## Objectif
Migrer le système de gestion des ressources depuis un modèle unique (Foodstock) vers un système générique multi-ressources.
Le but est de permettre à la fois la gestion des vivres, bois, minerai, métal, tissu, planches, etc., dans les villes et expéditions.

## Contexte technique
- **Base de données** : PostgreSQL avec Prisma ORM
- **Architecture** : Backend NestJS + Bot Discord
- **Modèles existants** : Town (foodStock), Expedition (foodStock), Character, Capability
- **Stockage actuel** : Champs `foodStock` directement dans Town et Expedition

## Étapes de développement

### Modèles Prisma et structure de données
- [ ] Créer les modèles Prisma ResourceType et ResourceStock dans `backend/prisma/schema.prisma`
- [ ] Ajouter un script de seed pour les types de ressources dans `backend/prisma/seed.ts`
- [ ] Créer un script de migration des données depuis Foodstock → ResourceStock dans `backend/scripts/migrateFoodstockToResource.ts`

### Backend et API
- [ ] Adapter la logique de capacité (récolte) dans `backend/src/services/capability.service.ts` vers ResourceStock
- [ ] Adapter les expéditions dans `backend/src/services/expedition.service.ts` (stock séparé)
- [ ] Créer endpoints API génériques dans `backend/src/controllers/resource.controller.ts` :
  - `GET /api/resources/:locationType/:locationId` - Récupérer tous les stocks d'un lieu
  - `POST /api/resources/:locationType/:locationId/:resourceTypeId` - Ajouter des ressources
  - `PUT /api/resources/:locationType/:locationId/:resourceTypeId` - Mettre à jour quantité

### Bot et commandes
- [ ] Remplacer la commande `/foodstock` par `/stock` dans `bot/src/commands/user-commands/stock.ts`
- [ ] Adapter les commandes d'expédition dans `bot/src/commands/user-commands/expedition.ts` pour utiliser le nouveau système
- [ ] Créer des commandes pour gérer différentes ressources :
  - `/stock add <resource> <quantity>` - Ajouter des ressources à la ville
  - `/stock expedition <id>` - Afficher le stock d'une expédition
  - `/stock transfer <from> <to> <resource> <quantity>` - Transférer entre ville/expédition

### Tests et validation
- [ ] Vérifier que `/stock` fonctionne correctement pour toutes les villes
- [ ] Vérifier la compatibilité avec les expéditions (création, gestion du stock)
- [ ] Vérifier que les capacités de récolte (Chasser, Cueillir, Pêcher) ajoutent bien les ressources dans ResourceStock
- [ ] Tester la migration des données existantes (foodStock → ResourceStock pour "Vivres")
- [ ] Valider la rétrocompatibilité pendant la transition

### Nettoyage
- [ ] Supprimer les champs `foodStock` des modèles Town et Expedition une fois la migration validée
- [ ] Nettoyer le code en supprimant les références obsolètes à `foodStock`
- [ ] Mettre à jour la documentation et supprimer les anciens commentaires

## Modèles Prisma détaillés

### ResourceType
```prisma
model ResourceType {
  id          Int             @id @default(autoincrement())
  name        String          @unique
  emoji       String
  category    String          // 'base', 'transformé'
  description String?
  stocks      ResourceStock[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

### ResourceStock
```prisma
model ResourceStock {
  id              Int          @id @default(autoincrement())
  locationType    String       // 'CITY' | 'EXPEDITION'
  locationId      Int
  resourceTypeId  Int
  quantity        Int          @default(0)
  resourceType    ResourceType @relation(fields: [resourceTypeId], references: [id], onDelete: Cascade)

  @@unique([locationType, locationId, resourceTypeId])
  @@index([locationType, locationId])
}
```

## Données de seed initiales

```typescript
// Dans backend/prisma/seed.ts
await prisma.resourceType.createMany({
  data: [
    { name: "Vivres", emoji: "🍞", category: "base", description: "Ressource brute de survie" },
    { name: "Bois", emoji: "🌲", category: "base", description: "Matériau brut" },
    { name: "Minerai", emoji: "⛏️", category: "base", description: "Matériau brut" },
    { name: "Métal", emoji: "⚙️", category: "transformé", description: "Produit du minerai" },
    { name: "Tissu", emoji: "🧵", category: "transformé", description: "Produit du bois" },
    { name: "Planches", emoji: "🪵", category: "transformé", description: "Produit du bois" },
    { name: "Nourriture", emoji: "🍖", category: "transformé", description: "Produit des vivres" },
  ],
  skipDuplicates: true,
});
```

## Script de migration

```typescript
// Migration temporaire dans /scripts/migrateFoodstockToResource.ts
const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });
const cities = await prisma.city.findMany({ include: { foodstock: true } });

  for (const city of cities) {
  await prisma.resourceStock.create({
    data: {
        locationType: "CITY",
        locationId: city.id,
        resourceTypeId: vivresType.id,
      quantity: city.foodstock.quantity,
    },
  });
}
```

## Commande /stock mise à jour

```
/stock
🏙️ Stock de la ville :
🍞 Vivres : 340
🌲 Bois : 120
⛏️ Minerai : 50
⚙️ Métal : 25
🧵 Tissu : 15
🪵 Planches : 8
🍖 Nourriture : 45
```

## Critères de succès
- [ ] Modèles Prisma créés et migrés
- [ ] /stock fonctionne et remplace /foodstock
- [ ] Toutes les ressources sont gérées via ResourceStock
- [ ] Les capacités de récolte utilisent bien la nouvelle structure
- [ ] L'ancienne table Foodstock est retirée proprement
- [ ] Le code reste backward-compatible pour les migrations en cours
