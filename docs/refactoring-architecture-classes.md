# Refactoring Architecture - Option 2 : Classes par Capacité

**Date**: 2025-10-23
**Status**: ✅ TERMINÉ - Architecture modulaire implémentée

---

## 🎯 Objectif

Refactorer le fichier `capability.service.ts` (1913 lignes) en une architecture modulaire où chaque capacité est une classe séparée.

## 📁 Nouvelle Structure

```
/backend/src/services/
├── capability.service.ts                    # Service orchestrateur (393 lignes)
├── capability/
│   ├── base-capability.service.ts          # Classe abstraite de base
│   └── capabilities/
│       ├── index.ts                         # Exports centralisés
│       ├── chasser.capability.ts            # Classe Chasser
│       ├── cueillir.capability.ts           # Classe Cueillir
│       ├── couper-du-bois.capability.ts     # Classe Couper du bois
│       ├── miner.capability.ts              # Classe Miner
│       ├── pecher.capability.ts             # Classe Pêcher
│       ├── divertir.capability.ts           # Classe Divertir
│       ├── cuisiner.capability.ts           # Classe Cuisiner
│       ├── soigner.capability.ts            # Classe Soigner
│       ├── cartographier.capability.ts      # Classe Cartographier
│       ├── rechercher.capability.ts         # Classe Rechercher
│       └── auspice.capability.ts            # Classe Auspice
└── types/
    └── capability-result.types.ts           # Types partagés
```

---

## 🏗️ Architecture

### BaseCapability (Classe Abstraite)

Toutes les capacités héritent de cette classe de base :

```typescript
export abstract class BaseCapability {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly capabilityRepo: CapabilityRepository
  ) {}

  abstract execute(
    characterId: string,
    capabilityId: string,
    params?: Record<string, any>
  ): Promise<CapabilityExecutionResult>;

  abstract readonly name: string;
  abstract readonly category: "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";
}
```

### Classe de Capacité (Exemple : ChasserCapability)

```typescript
export class ChasserCapability extends BaseCapability {
  readonly name = "Chasser";
  readonly category = "HARVEST" as const;

  async execute(
    characterId: string,
    capabilityId: string,
    params?: { isSummer?: boolean }
  ): Promise<CapabilityExecutionResult> {
    // Logique métier pure
    // Retourne CapabilityExecutionResult standardisé
  }
}
```

### Service Orchestrateur (CapabilityService)

Le nouveau `capability.service.ts` est un orchestrateur léger :

```typescript
export class CapabilityService {
  private readonly capabilities: Map<string, BaseCapability>;

  constructor(prisma: PrismaClient, capabilityRepo: CapabilityRepository) {
    // Initialise toutes les capacités
    this.capabilities = new Map();
    this.capabilities.set("chasser", new ChasserCapability(prisma, capabilityRepo));
    // ... autres capacités
  }

  // Méthodes publiques V2
  async executeChasser(...) { return this.capabilities.get("chasser").execute(...); }

  // Méthodes de compatibilité (deprecated)
  async executeCouperDuBois(...) { /* wrapper vers V2 */ }
}
```

---

## 📊 Bénéfices

### ✅ Problèmes Résolus

1. **Fichier trop long** : 1913 lignes → 393 lignes (service) + 11 fichiers de ~50-150 lignes
2. **Séparation des responsabilités** : Chaque capacité est isolée dans sa propre classe
3. **Testabilité** : Chaque capacité peut être testée unitairement indépendamment
4. **Maintenabilité** : Facile de trouver et modifier une capacité spécifique
5. **Extensibilité** : Ajouter une nouvelle capacité = créer une nouvelle classe

### 📈 Métriques

- **Fichier principal** : 1913 → 393 lignes (-79%)
- **Fichiers créés** : 13 nouveaux fichiers
- **Lignes moyennes par capacité** : ~80 lignes
- **Couplage** : Réduit (chaque capacité est indépendante)
- **Cohésion** : Augmentée (logique regroupée par capacité)

---

## 🔄 Compatibilité

### Méthodes Dépréciées (Maintenues pour compatibilité)

Le service orchestrateur maintient l'ancienne API via des wrappers :

```typescript
/**
 * @deprecated Use executeCouperDuBoisV2 instead
 */
async executeCouperDuBois(characterId: string) {
  const result = await this.executeCouperDuBoisV2(characterId, capabilityId);
  return { success: result.success, woodGained: result.loot?.["Bois"] || 0, ... };
}
```

Cela permet aux controllers existants de continuer à fonctionner sans modification.

---

## 📝 Capacités Implémentées

| Capacité | Classe | Fichier | Status |
|----------|--------|---------|--------|
| Chasser | `ChasserCapability` | `chasser.capability.ts` | ✅ |
| Cueillir | `CueillirCapability` | `cueillir.capability.ts` | ✅ |
| Couper du bois | `CouperDuBoisCapability` | `couper-du-bois.capability.ts` | ✅ |
| Miner | `MinerCapability` | `miner.capability.ts` | ✅ |
| Pêcher | `PecherCapability` | `pecher.capability.ts` | ✅ |
| Divertir | `DivertirCapability` | `divertir.capability.ts` | ✅ |
| Cuisiner | `CuisinerCapability` | `cuisiner.capability.ts` | ✅ |
| Soigner | `SoignerCapability` | `soigner.capability.ts` | ✅ |
| Cartographier | `CartographierCapability` | `cartographier.capability.ts` | ✅ |
| Rechercher | `RechercherCapability` | `rechercher.capability.ts` | ✅ |
| Auspice | `AuspiceCapability` | `auspice.capability.ts` | ✅ |

**Total : 11/11 capacités refactorées (100%)**

---

## 🚀 Comment Ajouter une Nouvelle Capacité

### Étape 1 : Créer la Classe

```typescript
// /backend/src/services/capability/capabilities/ma-nouvelle-capacite.capability.ts
import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";

export class MaNouvelleCapaciteCapability extends BaseCapability {
  readonly name = "Ma Nouvelle Capacité";
  readonly category = "SPECIAL" as const;

  async execute(
    characterId: string,
    capabilityId: string,
    params?: { /* vos paramètres */ }
  ): Promise<CapabilityExecutionResult> {
    // Votre logique métier ici
    return {
      success: true,
      message: "...",
      publicMessage: "...",
      paConsumed: 1,
      loot: {},
      metadata: { bonusApplied: [] },
    };
  }
}
```

### Étape 2 : Exporter dans index.ts

```typescript
// /backend/src/services/capability/capabilities/index.ts
export { MaNouvelleCapaciteCapability } from './ma-nouvelle-capacite.capability';
```

### Étape 3 : Ajouter dans l'Orchestrateur

```typescript
// /backend/src/services/capability.service.ts
import { MaNouvelleCapaciteCapability } from "./capability/capabilities";

constructor(...) {
  this.capabilities.set("ma nouvelle capacité", new MaNouvelleCapaciteCapability(prisma, capabilityRepo));
}

async executeMaNouvelleCapacite(...) {
  const capability = this.getCapability("ma nouvelle capacité");
  return capability.execute(...);
}
```

---

## 🧪 Tests

Avec cette architecture, chaque capacité peut être testée unitairement :

```typescript
describe('ChasserCapability', () => {
  it('should return correct food amount', async () => {
    const capability = new ChasserCapability(prismaMock, repoMock);
    const result = await capability.execute('char-id', 'cap-id', { isSummer: true });

    expect(result.success).toBe(true);
    expect(result.loot['Vivres']).toBeGreaterThan(0);
  });
});
```

---

## 🔧 Fichiers Supprimés

- ✅ `/backend/src/services/capability.service.legacy.ts` (1913 lignes)
- Les anciennes fonctions `use*Capability()` dans `character-capability.service.ts` peuvent maintenant être supprimées (mais gardées temporairement pour compatibilité)

---

## 📚 Documentation Connexe

- **Phase 1 & 2** : `/docs/refactoring-capabilities-DONE.md`
- **Plan initial** : `/docs/refactoring-capabilities-services.md`
- **Types** : `/backend/src/services/types/capability-result.types.ts`

---

## ✅ Conclusion

**Architecture Option 2 implémentée avec succès !**

- ✅ **11 classes de capacités** créées
- ✅ **1 classe de base** abstraite
- ✅ **1 service orchestrateur** léger
- ✅ **Compilation TypeScript** : 0 erreurs
- ✅ **Compatibilité** : 100% (ancienne API maintenue via wrappers)
- ✅ **Maintenabilité** : Excellent (code modulaire et découplé)

**🎉 Le fichier capability.service.ts est maintenant 5 fois plus petit et infiniment plus maintenable !**
