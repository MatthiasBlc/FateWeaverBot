# Supernova Task: Améliorer la validation des ressources d'expédition

## Contexte

Le système d'expédition permet de créer des expéditions avec des ressources initiales (vivres, nourriture, etc.). Actuellement, si la ville n'a pas assez de ressources, le message d'erreur est générique et peu informatif.

## Objectif

Améliorer le message d'erreur pour indiquer précisément quelle ressource manque, combien est demandé, et combien est disponible.

## Fichier à modifier

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/expedition.service.ts`

**Lignes concernées:** 252-283

## Code actuel (lignes 252-283)

```typescript
// Validate that the town has enough resources
for (const resource of initialResources) {
  const townStock = await prisma.resourceStock.findFirst({
    where: {
      locationType: "CITY",
      locationId: townId,
      resourceTypeId: resource.resourceTypeId,
    },
    include: {
      resourceType: true,
    },
  });

  if (
    !townStock ||
    townStock.quantity < resource.quantity
  ) {
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: resource.resourceTypeId },
    });
    throw new Error(
      `Insufficient ${resourceType?.name || "resource"} in town stock`
    );
  }
}
```

## Modification demandée

Remplacer le message d'erreur générique par un message explicite :

**Nouveau message:**
```
Ressources insuffisantes : {nom de la ressource} (demandé: {quantité demandée}, disponible: {quantité disponible})
```

**Exemple de message attendu:**
```
Ressources insuffisantes : Vivres (demandé: 50, disponible: 30)
```

## Code attendu

```typescript
// Validate that the town has enough resources
for (const resource of initialResources) {
  const townStock = await prisma.resourceStock.findFirst({
    where: {
      locationType: "CITY",
      locationId: townId,
      resourceTypeId: resource.resourceTypeId,
    },
    include: {
      resourceType: true,
    },
  });

  const availableQuantity = townStock?.quantity || 0;

  if (!townStock || availableQuantity < resource.quantity) {
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: resource.resourceTypeId },
    });
    throw new Error(
      `Ressources insuffisantes : ${resourceType?.name || "resource"} (demandé: ${resource.quantity}, disponible: ${availableQuantity})`
    );
  }
}
```

## Instructions pour Supernova

1. Ouvre le fichier `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/expedition.service.ts`
2. Localise les lignes 252-283 (section de validation des ressources)
3. Modifie le message d'erreur comme indiqué ci-dessus
4. Vérifie que la syntaxe est correcte
5. Compile le backend pour vérifier qu'il n'y a pas d'erreurs : `npm run build` depuis `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/`

## Rapport demandé

**À la fin de ta tâche, crée un fichier de rapport :**

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/.supernova/report-resource-validation.md`

**Contenu du rapport:**

```markdown
# Rapport: Validation des ressources d'expédition

## Statut
[✅ Terminé / ❌ Erreur / ⚠️ Partiel]

## Modifications effectuées
- Fichier: [chemin du fichier]
- Lignes modifiées: [numéros de lignes]
- Description: [ce qui a été changé]

## Tests de compilation
- `npm run build` : [✅ OK / ❌ Erreur]
- Erreurs rencontrées: [si applicable]

## Résumé court (< 300 tokens)
[Décris en quelques phrases ce qui a été fait, les problèmes rencontrés, et le résultat final]
```

## Notes importantes

- Ne modifie que les lignes concernées (252-283)
- Garde la même logique, change uniquement le message d'erreur
- Assure-toi que `availableQuantity` est bien défini avant de l'utiliser dans le message
- Le message doit être en français
