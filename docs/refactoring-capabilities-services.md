# Refactoring des Services de Capacités

**Date**: 2025-10-23
**Objectif**: Unifier l'architecture des capacités pour éliminer la duplication de code et améliorer la maintenabilité
**Status**: 🔴 EN COURS

---

## 📊 État des lieux (Analyse)

### Architecture actuelle

Il existe **2 services** qui gèrent les capacités avec chevauchement et duplication :

#### 1. `character-capability.service.ts` (Service principal - utilisé par le bot)
- **Rôle**: Point d'entrée principal pour l'exécution des capacités
- **Fonction principale**: `useCharacterCapability(characterId, capabilityIdentifier, ...)`
- **Switch case** qui route vers des fonctions privées

#### 2. `capability.service.ts` (Service métier)
- **Rôle**: Logique métier des capacités
- **Fonctions publiques** `execute*` qui implémentent la logique

---

## 🔍 Inventaire complet des capacités

### Légende
- ✅ = Implémenté et fonctionnel
- ⚠️ = Duplication (existe dans les 2 services)
- ❌ = Implémentation obsolète (existe mais pas utilisée)
- 🔄 = Délégation correcte (character-capability → capability.service)

| Capacité | character-capability.service | capability.service | Status | Bonus |
|----------|------------------------------|-------------------|--------|-------|
| **Chasser** | `useHuntingCapability()` ✅ | `executeHarvestCapacity("Chasser")` ❌ | ⚠️ Duplication | LUCKY_ROLL ✅ |
| **Cueillir** | `useGatheringCapability()` ✅ | `executeHarvestCapacity("Cueillir")` ❌ | ⚠️ Duplication | LUCKY_ROLL ✅ |
| **Pêcher** | `useFishingCapability()` 🔄 | `executeFish()` ✅ | ✅ Délégation OK | LUCKY_ROLL ✅ |
| **Miner** | Switch case 🔄 | `executeMiner()` ✅ | ✅ Délégation OK | LUCKY_ROLL ✅ |
| **Couper du bois** | `useLoggingCapability()` ✅ | `executeCouperDuBois()` ❌ | ⚠️ Duplication | LUCKY_ROLL ✅ |
| **Cuisiner** | `useCookingCapability()` ✅ | `executeCraft("cuisiner")` ❌ | ⚠️ Duplication | LUCKY_ROLL ✅ |
| **Divertir** | `useEntertainmentCapability()` ✅ | `executeDivertir()` ❌ | ⚠️ Duplication | ENTERTAIN_BURST ❌ PAS UTILISÉ |
| **Soigner** | ❌ Absent | `executeSoigner()` ✅ | ✅ Utilisé directement | HEAL_EXTRA ✅ |
| **Tisser** | ❌ Absent | `executeCraft("tisser")` ✅ | ✅ Via craft | ADMIN_INTERPRETED |
| **Forger** | ❌ Absent | `executeCraft("forger")` ✅ | ✅ Via craft | ADMIN_INTERPRETED |
| **Menuiser** | ❌ Absent | `executeCraft("menuiser")` ✅ | ✅ Via craft | ADMIN_INTERPRETED |
| **Cartographier** | `useCartographyCapability()` ✅ | `executeResearch("cartographier")` ❌ | ⚠️ Duplication | ADMIN_INTERPRETED |
| **Rechercher** | `useResearchingCapability()` ✅ | `executeResearch("rechercher")` ❌ | ⚠️ Duplication | ADMIN_INTERPRETED |
| **Auspice** | `useAuspiceCapability()` ✅ | `executeResearch("auspice")` ❌ | ⚠️ Duplication | ADMIN_INTERPRETED |

---

## 🚨 Problèmes identifiés

### 1. **Duplication de code majeure**
- **8 capacités** ont une implémentation dans les 2 services
- Maintenance difficile : chaque modification doit être faite 2 fois
- Risque d'incohérence entre les 2 versions

### 2. **Bonus non fonctionnels**
- **ENTERTAIN_BURST** (Divertir+) implémenté dans `executeDivertir()` mais **jamais utilisé** car le bot appelle `useEntertainmentCapability()`
- Problème découvert lors de l'ajout du système DIVERT_EXTRA

### 3. **Incohérence architecturale**
- Certaines capacités délèguent correctement (Pêcher, Miner, Soigner)
- D'autres sont dupliquées (Chasser, Cueillir, Divertir, Cuisiner, etc.)
- Aucune logique claire sur "qui fait quoi"

### 4. **Gestion des PA incohérente**
- Dans `character-capability.service` : gestion centralisée des PA après le switch
- Dans `capability.service` : chaque fonction gère ses propres PA
- Risque de double déduction ou oubli

### 5. **Gestion des ressources incohérente**
- `character-capability.service` a une transaction centralisée pour ajouter les ressources
- `capability.service` gère les ressources dans chaque fonction

---

## 🎯 Architecture cible

### Principe : **Séparation des responsabilités claire**

```
┌─────────────────────────────────────────────────────────────┐
│  character-capability.service.ts (Orchestrateur)            │
│  ─────────────────────────────────────────────────────       │
│  • Point d'entrée unique: useCharacterCapability()          │
│  • Validation des permissions & prérequis                   │
│  • Vérification des PA disponibles                          │
│  • Routage vers capability.service                          │
│  • Gestion centralisée de la transaction finale:            │
│    - Déduction des PA                                        │
│    - Mise à jour des ressources en ville                    │
│    - Mise à jour du personnage                              │
│  • Formatage des messages de retour                         │
└─────────────────────────────────────────────────────────────┘
                              ↓ délègue
┌─────────────────────────────────────────────────────────────┐
│  capability.service.ts (Logique métier pure)                │
│  ──────────────────────────────────────────────               │
│  • Fonctions publiques execute*() pour chaque capacité      │
│  • Implémentation de la logique spécifique                  │
│  • Gestion des bonus (LUCKY_ROLL, HEAL_EXTRA, etc.)         │
│  • Calcul des résultats (loot, effets, etc.)                │
│  • NE GÈRE PAS les PA directement                           │
│  • NE GÈRE PAS les transactions DB globales                 │
│  • Retourne un objet de résultat standardisé                │
└─────────────────────────────────────────────────────────────┘
```

### Interface de résultat standardisée

```typescript
interface CapabilityExecutionResult {
  success: boolean;
  message: string;              // Message pour le joueur
  publicMessage?: string;       // Message public (feed)
  loot?: {                      // Ressources générées/consommées
    [resourceName: string]: number;
  };
  effects?: {                   // Effets sur les personnages
    targetCharacterId: string;
    hpChange?: number;
    pmChange?: number;
    statusChange?: string;
  }[];
  paConsumed: number;           // PA réellement consommés
  metadata?: {                  // Métadonnées pour le suivi
    bonusApplied?: string[];
    rolls?: any;
  };
}
```

---

## 📝 Plan de refactoring détaillé

### Phase 1 : Préparation (1-2h)
- [x] Analyser toutes les capacités
- [x] Documenter l'état actuel
- [ ] Créer l'interface `CapabilityExecutionResult` standardisée
- [ ] Créer des tests unitaires pour les capacités existantes (non-régression)

### Phase 2 : Refactoring de capability.service.ts (2-3h)

#### 2.1 Créer/Adapter les fonctions execute*
- [ ] `executeChasser()` - Déplacer logique de `useHuntingCapability`
- [ ] `executeCueillir()` - Déplacer logique de `useGatheringCapability`
- [ ] `executeCouperDuBois()` - Déjà existe, vérifier cohérence
- [ ] `executeCuisiner()` - Déplacer logique de `useCookingCapability`
- [ ] `executeDivertir()` - Déjà existe avec ENTERTAIN_BURST ✅
- [ ] `executeCartographier()` - Déplacer logique de `useCartographyCapability`
- [ ] `executeRechercher()` - Déplacer logique de `useResearchingCapability`
- [ ] `executeAuspice()` - Déplacer logique de `useAuspiceCapability`

#### 2.2 Standardiser les retours
Chaque fonction doit retourner `CapabilityExecutionResult` avec :
- success, message, publicMessage
- loot (ressources produites/consommées)
- paConsumed (PA réellement utilisés)
- metadata (logs des bonus, tirages)

#### 2.3 Supprimer la gestion des PA
- Retirer tous les appels à `consumePA()` dans capability.service
- Retirer toutes les transactions `character.update({ paTotal: ... })`
- La gestion des PA sera centralisée dans character-capability.service

#### 2.4 Supprimer la gestion des ressources en ville
- Retirer tous les `resourceStock.upsert()` dans capability.service
- Retourner juste les quantités dans `loot`
- La mise à jour du stock sera faite par character-capability.service

### Phase 3 : Refactoring de character-capability.service.ts (2-3h)

#### 3.1 Simplifier useCharacterCapability
```typescript
async useCharacterCapability(characterId, capabilityIdentifier, ...params) {
  // 1. Récupérer personnage et capacité
  const character = await this.getCharacter(characterId);
  const capability = await this.getCapability(capabilityIdentifier);

  // 2. Vérifications préalables
  this.validateCharacterHasCapability(character, capability);
  this.validateCanUsePA(character, capability.costPA);

  // 3. Exécuter la capacité (délégation à capability.service)
  const result = await this.capabilityService.executeCapability(
    character,
    capability,
    params
  );

  // 4. Transaction finale centralisée
  const updatedCharacter = await this.applyCapabilityResults(
    character,
    capability,
    result
  );

  return { ...result, updatedCharacter };
}
```

#### 3.2 Créer executeCapability() - routeur central
```typescript
private async executeCapability(character, capability, params) {
  const capabilityName = capability.name.toLowerCase();

  switch (capabilityName) {
    case "chasser":
      return await this.capabilityService.executeChasser(character.id, params.isSummer);
    case "cueillir":
      return await this.capabilityService.executeCueillir(character.id, params.isSummer);
    case "pêcher":
      return await this.capabilityService.executeFish(character.id, params.paToUse);
    // ... etc pour toutes les capacités
  }
}
```

#### 3.3 Créer applyCapabilityResults() - transaction centralisée
```typescript
private async applyCapabilityResults(character, capability, result) {
  return await prisma.$transaction(async (tx) => {
    // 1. Déduire les PA
    await tx.character.update({
      where: { id: character.id },
      data: {
        paTotal: { decrement: result.paConsumed },
        paUsedToday: { increment: result.paConsumed },
        // + autres mises à jour (divertCounter, etc.)
      }
    });

    // 2. Mettre à jour les ressources en ville
    if (result.loot) {
      for (const [resourceName, quantity] of Object.entries(result.loot)) {
        await this.updateCityResource(tx, character.townId, resourceName, quantity);
      }
    }

    // 3. Appliquer les effets sur les personnages
    if (result.effects) {
      for (const effect of result.effects) {
        await this.applyCharacterEffect(tx, effect);
      }
    }

    // 4. Retourner le personnage mis à jour
    return await tx.character.findUnique({ where: { id: character.id } });
  });
}
```

#### 3.4 Supprimer toutes les fonctions use*Capability
- [ ] Supprimer `useHuntingCapability()`
- [ ] Supprimer `useGatheringCapability()`
- [ ] Supprimer `useLoggingCapability()`
- [ ] Supprimer `useFishingCapability()`
- [ ] Supprimer `useEntertainmentCapability()`
- [ ] Supprimer `useCookingCapability()`
- [ ] Supprimer `useCartographyCapability()`
- [ ] Supprimer `useResearchingCapability()`
- [ ] Supprimer `useAuspiceCapability()`

### Phase 4 : Tests et validation (1-2h)
- [ ] Tester chaque capacité une par une
- [ ] Vérifier que tous les bonus fonctionnent (LUCKY_ROLL, HEAL_EXTRA, ENTERTAIN_BURST)
- [ ] Vérifier les logs
- [ ] Vérifier les PA
- [ ] Vérifier les ressources en ville
- [ ] Tests de non-régression

### Phase 5 : Nettoyage et documentation (30min)
- [ ] Supprimer le code mort dans capability.service (executeHarvestCapacity qui fait doublon)
- [ ] Mettre à jour la documentation
- [ ] Commit avec message descriptif

---

## 🔧 Implémentation progressive (Si arrêt en cours de session)

### Option : Refactoring capacité par capacité
Pour ne pas tout casser d'un coup, on peut refactorer une capacité à la fois :

#### Étape pour chaque capacité :
1. **Préparer** : S'assurer que `execute*()` existe dans capability.service avec la bonne signature
2. **Modifier** : Adapter `useCharacterCapability()` pour appeler `execute*()`
3. **Tester** : Vérifier que la capacité fonctionne toujours
4. **Nettoyer** : Supprimer l'ancienne fonction `use*Capability()` une fois confirmé

#### Ordre suggéré (du plus simple au plus complexe) :
1. ✅ **Divertir** (urgent - bonus ENTERTAIN_BURST ne fonctionne pas)
2. **Couper du bois** (simple, pas de paramètres complexes)
3. **Chasser** (bonus LUCKY_ROLL déjà fonctionnel)
4. **Cueillir** (bonus LUCKY_ROLL déjà fonctionnel)
5. **Cuisiner** (bonus LUCKY_ROLL + gestion quantités)
6. **Cartographier** (admin-interpreted, simple)
7. **Rechercher** (admin-interpreted, simple)
8. **Auspice** (admin-interpreted, simple)

---

## 📊 Bénéfices attendus

### Maintenabilité
- ✅ Un seul endroit pour modifier la logique d'une capacité
- ✅ Moins de code dupliqué (-40% estimé)
- ✅ Plus facile à tester unitairement

### Fiabilité
- ✅ Tous les bonus fonctionnent correctement
- ✅ Gestion cohérente des PA et ressources
- ✅ Moins de risque de bugs

### Extensibilité
- ✅ Facile d'ajouter de nouvelles capacités
- ✅ Facile d'ajouter de nouveaux types de bonus
- ✅ Architecture claire et documentée

---

## 🚀 Pour reprendre le travail

### Si on a fait Divertir uniquement (fix rapide)
```typescript
// Dans character-capability.service.ts, case "divertir":
case "divertir":
  const divertResult = await this.capabilityService.executeDivertir(characterId);
  result = {
    success: divertResult.success,
    message: divertResult.message,
    publicMessage: divertResult.message, // Adapter si nécessaire
    loot: {},
  };
  break;
```

### Si on veut continuer le refactoring complet
1. Reprendre à la Phase en cours (voir checkboxes ci-dessus)
2. Suivre l'ordre suggéré capacité par capacité
3. Tester après chaque capacité
4. Documenter les changements

---

## 📎 Fichiers concernés

- `/backend/src/services/capability.service.ts` (logique métier)
- `/backend/src/services/character/character-capability.service.ts` (orchestrateur)
- `/backend/src/util/character-validators.ts` (helpers pour bonus)
- Tests à créer : `/backend/src/services/__tests__/capability.service.test.ts`

---

**Dernière mise à jour** : 2025-10-23 14:10
**Temps estimé total** : 6-10 heures
**Priorité** : 🔴 HAUTE (bloque les bonus pour plusieurs capacités)
