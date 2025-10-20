# Phase 4: Repository Layer

**Date**: 2025-10-20
**Objectif**: Créer une couche repository pour abstraire l'accès aux données Prisma

---

## Contexte

Nous sommes en Phase 4 du refactoring backend. Les phases 0-3 sont complètes :
- Phase 0 : Setup & Tooling ✅
- Phase 1 : Query Builders ✅
- Phase 2 : Extract Utilities ✅
- Phase 3 : Validation Layer ✅

Cette phase va créer des repositories pour abstraire l'accès aux données, en préparation de la Phase 5 où nous refactorerons les services pour les utiliser.

---

## Objectifs de la Phase 4

1. Créer des repositories pour les principales entités
2. Utiliser les query builders existants (Phase 1)
3. Encapsuler toute la logique d'accès aux données Prisma
4. Préparer pour l'injection dans les services (Phase 5)
5. **IMPORTANT** : Ne PAS modifier les services dans cette phase (Phase 5 uniquement)

---

## Architecture Cible

```
backend/src/
├── domain/
│   └── repositories/
│       ├── character.repository.ts        (nouveau)
│       ├── resource.repository.ts         (nouveau)
│       ├── expedition.repository.ts       (nouveau)
│       ├── project.repository.ts          (nouveau)
│       ├── chantier.repository.ts         (nouveau)
│       ├── capability.repository.ts       (nouveau)
│       ├── guild.repository.ts            (nouveau)
│       ├── job.repository.ts              (nouveau)
│       ├── object.repository.ts           (nouveau)
│       ├── role.repository.ts             (nouveau)
│       ├── skill.repository.ts            (nouveau)
│       ├── town.repository.ts             (nouveau)
│       ├── user.repository.ts             (nouveau)
│       └── season.repository.ts           (nouveau)
└── infrastructure/
    └── database/
        └── query-builders/                (existant - Phase 1)
            ├── character.queries.ts
            ├── resource.queries.ts
            ├── expedition.queries.ts
            ├── project.queries.ts
            └── chantier.queries.ts
```

---

## Tâches Détaillées

### Tâche 1: Analyser les Services Existants

Pour créer les bons repositories, il faut d'abord comprendre quelles opérations de données sont utilisées dans les services.

**Fichiers à analyser** :
- `backend/src/services/character.service.ts` (~1,157 LOC)
- `backend/src/services/resource.service.ts`
- `backend/src/services/expedition.service.ts`
- `backend/src/services/capability.service.ts`
- `backend/src/services/project.service.ts`
- `backend/src/services/chantier.service.ts`
- `backend/src/services/guild.service.ts`
- `backend/src/services/job.service.ts`
- `backend/src/services/object.service.ts`
- `backend/src/services/role.service.ts`
- `backend/src/services/skill.service.ts`
- `backend/src/services/town.service.ts`
- `backend/src/services/user.service.ts`
- `backend/src/services/season.service.ts`

**Pour chaque service, identifier** :
1. Tous les appels `prisma.*.findUnique()`
2. Tous les appels `prisma.*.findFirst()`
3. Tous les appels `prisma.*.findMany()`
4. Tous les appels `prisma.*.create()`
5. Tous les appels `prisma.*.update()`
6. Tous les appels `prisma.*.updateMany()`
7. Tous les appels `prisma.*.delete()`
8. Tous les appels `prisma.*.upsert()`
9. Les patterns de `where`, `include`, `orderBy` utilisés

---

### Tâche 2: Créer les Repositories Principaux

**Priorité de création** :
1. **CharacterRepository** (le plus critique et complexe)
2. **ResourceRepository**
3. **ExpeditionRepository**
4. **ProjectRepository**
5. **ChantierRepository**
6. **CapabilityRepository**
7. Les 8 autres repositories (plus simples)

#### Template de Repository

```typescript
import { PrismaClient, Prisma } from "@prisma/client";
import { EntityQueries } from "../../infrastructure/database/query-builders/entity.queries";

export class EntityRepository {
  constructor(private prisma: PrismaClient) {}

  // FIND methods
  async findById(id: string) {
    return this.prisma.entity.findUnique({
      where: { id },
      ...EntityQueries.fullInclude()
    });
  }

  async findAll() {
    return this.prisma.entity.findMany({
      ...EntityQueries.baseInclude()
    });
  }

  // CREATE methods
  async create(data: Prisma.EntityCreateInput) {
    return this.prisma.entity.create({
      data,
      ...EntityQueries.fullInclude()
    });
  }

  // UPDATE methods
  async update(id: string, data: Prisma.EntityUpdateInput) {
    return this.prisma.entity.update({
      where: { id },
      data,
      ...EntityQueries.fullInclude()
    });
  }

  // DELETE methods
  async delete(id: string) {
    return this.prisma.entity.delete({
      where: { id }
    });
  }
}
```

---

### Tâche 3: CharacterRepository - Le Plus Complexe

**File**: `backend/src/domain/repositories/character.repository.ts`

Méthodes requises (basées sur `character.service.ts`) :

```typescript
export class CharacterRepository {
  constructor(private prisma: PrismaClient) {}

  // FIND methods
  async findById(id: string)
  async findActiveCharacter(userId: string, townId: string)
  async findUserByDiscordId(discordId: string)
  async findAllByTown(townId: string)
  async findAllByGuild(guildId: string)
  async findAllDead(townId: string)

  // CREATE methods
  async create(data: Prisma.CharacterCreateInput)
  async createUser(discordId: string, username: string)

  // UPDATE methods
  async update(id: string, data: Prisma.CharacterUpdateInput)
  async updateStats(id: string, hp?: number, pm?: number, pa?: number)
  async updateHunger(id: string, hungerLevel: number)
  async deactivateOtherCharacters(userId: string, townId: string, exceptId?: string)
  async revive(id: string)
  async kill(id: string)

  // CAPABILITY methods
  async addCapability(characterId: string, capabilityId: string)
  async removeCapability(characterId: string, capabilityId: string)
  async getCapabilities(characterId: string)
  async hasCapability(characterId: string, capabilityName: string): Promise<boolean>

  // INVENTORY methods
  async getInventory(characterId: string)
  async addItemToInventory(characterId: string, itemData: any)
  async removeItemFromInventory(slotId: string)

  // SKILL methods
  async addSkill(characterId: string, skillId: string)
  async removeSkill(characterId: string, skillId: string)
  async getSkills(characterId: string)

  // ROLE methods
  async addRole(characterId: string, roleId: string)
  async removeRole(characterId: string, roleId: string)
  async getRoles(characterId: string)
}
```

**IMPORTANT** : Utiliser `CharacterQueries` (Phase 1) pour les `include` et `where` complexes.

---

### Tâche 4: ResourceRepository

**File**: `backend/src/domain/repositories/resource.repository.ts`

Méthodes requises :

```typescript
export class ResourceRepository {
  constructor(private prisma: PrismaClient) {}

  // RESOURCE TYPE methods
  async findResourceTypeByName(name: string)
  async findResourceTypeById(id: number)
  async getAllResourceTypes()

  // STOCK methods
  async getStock(locationType: LocationType, locationId: string, resourceTypeId: number)
  async getAllStockForLocation(locationType: LocationType, locationId: string)
  async upsertStock(locationType: LocationType, locationId: string, resourceTypeId: number, amount: number)
  async decrementStock(locationType: LocationType, locationId: string, resourceTypeId: number, amount: number)
  async setStock(locationType: LocationType, locationId: string, resourceTypeId: number, quantity: number)
  async deleteStock(locationType: LocationType, locationId: string, resourceTypeId: number)
}
```

**IMPORTANT** : Utiliser `ResourceQueries` (Phase 1) pour les patterns complexes.

---

### Tâche 5: ExpeditionRepository

**File**: `backend/src/domain/repositories/expedition.repository.ts`

Méthodes requises :

```typescript
export class ExpeditionRepository {
  constructor(private prisma: PrismaClient) {}

  // FIND methods
  async findById(id: string)
  async findAllByTown(townId: string)
  async findActive(townId: string)
  async findPending(townId: string)

  // CREATE methods
  async create(data: Prisma.ExpeditionCreateInput)

  // UPDATE methods
  async update(id: string, data: Prisma.ExpeditionUpdateInput)
  async updateStatus(id: string, status: ExpeditionStatus)

  // MEMBERS methods
  async addMember(expeditionId: string, characterId: string)
  async removeMember(expeditionId: string, characterId: string)
  async getMembers(expeditionId: string)

  // VOTE methods
  async addVote(expeditionId: string, characterId: string, vote: boolean)
  async getVotes(expeditionId: string)
}
```

**IMPORTANT** : Utiliser `ExpeditionQueries` (Phase 1).

---

### Tâche 6: ProjectRepository

**File**: `backend/src/domain/repositories/project.repository.ts`

```typescript
export class ProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string)
  async findAllAvailable()
  async findByTown(townId: string)
  async create(data: Prisma.ProjectCreateInput)
  async update(id: string, data: Prisma.ProjectUpdateInput)
  async delete(id: string)
}
```

**IMPORTANT** : Utiliser `ProjectQueries` (Phase 1).

---

### Tâche 7: ChantierRepository

**File**: `backend/src/domain/repositories/chantier.repository.ts`

```typescript
export class ChantierRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string)
  async findAllByTown(townId: string)
  async findActive(townId: string)
  async create(data: Prisma.ChantierCreateInput)
  async update(id: string, data: Prisma.ChantierUpdateInput)
  async updateProgress(id: string, progressIncrement: number)
  async complete(id: string)
  async delete(id: string)
}
```

**IMPORTANT** : Utiliser `ChantierQueries` (Phase 1).

---

### Tâche 8: Repositories Simples (8 fichiers)

Pour les entités plus simples, créer des repositories basiques avec CRUD :

1. **CapabilityRepository** (`capability.repository.ts`)
   - findById, findAll, findByName, create, update, delete

2. **GuildRepository** (`guild.repository.ts`)
   - findById, findAll, findByTown, create, update, delete

3. **JobRepository** (`job.repository.ts`)
   - findById, findAll, findByName

4. **ObjectRepository** (`object.repository.ts`)
   - findById, findAll, findByType, create, update, delete

5. **RoleRepository** (`role.repository.ts`)
   - findById, findAll, findByName, create, update, delete

6. **SkillRepository** (`skill.repository.ts`)
   - findById, findAll, findByName

7. **TownRepository** (`town.repository.ts`)
   - findById, findAll, findByGuild, create, update, delete

8. **UserRepository** (`user.repository.ts`)
   - findById, findByDiscordId, create, update

9. **SeasonRepository** (`season.repository.ts`)
   - getCurrent, getAll, create, update

---

## Stratégie d'Exécution

**Ordre recommandé** :

1. **Analyser les services** en parallèle (agents) pour identifier les méthodes nécessaires (30 min)
2. **Créer CharacterRepository** en priorité (le plus complexe) (90 min)
3. **Créer ResourceRepository** (45 min)
4. **Créer ExpeditionRepository** (45 min)
5. **Créer ProjectRepository** (30 min)
6. **Créer ChantierRepository** (30 min)
7. **Créer CapabilityRepository** (20 min)
8. **Créer les 8 repositories simples** en parallèle (agents) (60 min)
9. **Vérifier typecheck** après chaque groupe (15 min)
10. **Vérifier build final** (5 min)

**Durée estimée totale** : 6-8 heures

---

## Points d'Attention

1. **Ne PAS modifier les services** : Cette phase crée uniquement les repositories. Phase 5 les utilisera.
2. **Réutiliser les Query Builders** : Utiliser les `*.queries.ts` créés en Phase 1
3. **Types Prisma** : Utiliser `Prisma.EntityCreateInput`, `Prisma.EntityUpdateInput`
4. **Injection du PrismaClient** : Tous les repositories acceptent `PrismaClient` dans le constructeur
5. **Méthodes async** : Toutes les méthodes de repository doivent être `async`
6. **Return types** : Laisser TypeScript inférer les types de retour (Prisma les gère bien)

---

## Commandes Utiles

```bash
# Vérifier la compilation
cd /home/bouloc/Repo/FateWeaverBot/backend
npm run typecheck

# Construire
npm run build

# Voir les services existants
ls -la src/services/

# Compter les lignes d'un service
wc -l src/services/character.service.ts
```

---

## Livrables

À la fin de cette phase, nous devons avoir :

1. ✅ 14 fichiers de repositories créés
2. ✅ Toutes les méthodes d'accès aux données encapsulées
3. ✅ Utilisation des query builders (Phase 1)
4. ✅ TypeCheck qui passe
5. ✅ Build qui réussit
6. ✅ Rapport `.supernova/report-phase4-repository-layer.md`
7. ✅ `docs/backend-refactoring/05-PROGRESS-TRACKER.md` mis à jour

**Note** : Les services NE SONT PAS modifiés dans cette phase.

---

## Format du Rapport Final

Le rapport dans `.supernova/report-phase4-repository-layer.md` doit contenir :

### Section 1 : Résumé Exécutif (≤300 tokens)
- Nombre de repositories créés
- Nombre total de méthodes créées
- Problèmes rencontrés
- Temps total
- Statut final (TypeCheck, Build)

### Section 2 : Détails Techniques
- Liste complète des repositories créés
- Méthodes par repository
- Exemples de code
- Utilisation des query builders

### Section 3 : Métriques
- Repositories par catégorie (complexe vs simple)
- Méthodes totales créées
- Lignes de code ajoutées
- Réutilisation des query builders

### Section 4 : Prochaines Étapes
- Phase 5 : Refactor Services (utiliser les repositories)

---

**IMPORTANT** : Crée ce rapport AUTOMATIQUEMENT à la fin de l'exécution, avec le résumé de ≤300 tokens en première section.
