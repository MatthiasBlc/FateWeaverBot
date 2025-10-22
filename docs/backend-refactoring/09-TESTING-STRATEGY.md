# Phase 9 - Testing Strategy (Docker Compose Environment)

**Date**: 2025-10-22
**Status**: READY TO IMPLEMENT
**Environment**: Docker Compose (PostgreSQL, Backend, Discord Bot)

---

## 🎯 Objectif

Mettre en place une stratégie de tests optimisée pour un environnement Docker Compose, avec :
- Tests unitaires (services, repositories, utilities)
- Tests d'intégration (API endpoints)
- Tests E2E optionnels (workflow complet)
- Coverage >70%

---

## 📊 Stratégie de Test Recommandée

### Option A : Tests DANS le Container Backend ✅ **RECOMMANDÉ**

**Avantages** :
- ✅ Utilise la BDD PostgreSQL déjà en place
- ✅ Pas de configuration supplémentaire
- ✅ Environnement identique à la production
- ✅ Partage les volumes et le réseau Docker
- ✅ Seed data disponible

**Inconvénients** :
- ⚠️ Partage la BDD dev (solution : prefix tables de test)
- ⚠️ Plus lent que les tests en mémoire

### Option B : Tests HORS Container (SQLite en mémoire)

**Avantages** :
- ⚡ Ultra rapide (pas de Docker overhead)
- 🔒 Isolation complète

**Inconvénients** :
- ❌ Nécessite configuration SQLite + Prisma
- ❌ Différences SQL PostgreSQL vs SQLite
- ❌ Seed data à recréer
- ❌ Pas de test des vraies queries PostgreSQL

### Option C : Tests avec BDD PostgreSQL Dédiée

**Avantages** :
- ✅ Isolation complète
- ✅ PostgreSQL réel

**Inconvénients** :
- ❌ Nécessite ajout service `postgres-test` au docker-compose
- ❌ Plus de complexité
- ❌ Gestion migrations + seed séparée

---

## 🏆 Solution Recommandée : **Option A++**

**Tests DANS le container backend avec isolation via base de données de test séparée**

### Architecture

```
┌─────────────────────────────────────────────┐
│  Docker Compose Network (internal)          │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │  Postgres   │──────│  Backend Dev    │  │
│  │             │      │  (API running)  │  │
│  │  - mydb     │      └─────────────────┘  │
│  │  - mydb_test│                            │
│  └─────────────┘                            │
│        │                                    │
│        └──────────┐                         │
│                   │                         │
│              ┌────▼──────────────┐          │
│              │  Backend Test     │          │
│              │  (npm run test)   │          │
│              │  Uses: mydb_test  │          │
│              └───────────────────┘          │
└─────────────────────────────────────────────┘
```

### Implémentation

#### 1. Créer une Base de Test

```bash
# Exécuter dans le container postgres
docker compose exec postgres psql -U myuser -d postgres -c "CREATE DATABASE mydb_test;"
```

#### 2. Configuration Jest avec Variables d'Environnement

**Fichier** : `backend/.env.test` (nouveau)

```env
NODE_ENV=test
DATABASE_URL=postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public
PORT=3002
```

#### 3. Setup de Test Amélioré

**Fichier** : `backend/src/__tests__/setup.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public"
    }
  }
});

beforeAll(async () => {
  console.log("🧪 Test suite starting...");
  console.log("📊 Database:", process.env.DATABASE_URL);

  // Appliquer les migrations
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    console.log("✅ Migrations applied");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }

  // Seed minimal pour les tests
  await seedTestData();
  console.log("✅ Test data seeded");
});

afterAll(async () => {
  // Cleanup : supprimer toutes les données de test
  console.log("🧹 Cleaning up test data...");

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.log(`Warning: Could not truncate ${tablename}`);
      }
    }
  }

  await prisma.$disconnect();
  console.log("✅ Test suite completed");
});

// Seed minimal pour les tests
async function seedTestData() {
  // Créer quelques données de base nécessaires aux tests
  await prisma.guild.create({
    data: {
      discordId: "test-guild-123",
      name: "Test Guild"
    }
  });

  await prisma.user.create({
    data: {
      discordId: "test-user-123",
      username: "TestUser"
    }
  });

  // Ajouter d'autres données de base...
}
```

#### 4. Script de Test dans package.json

**Fichier** : `backend/package.json`

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:coverage": "NODE_ENV=test jest --coverage",
    "test:docker": "docker compose exec -e NODE_ENV=test backenddev npm run test",
    "test:docker:watch": "docker compose exec -e NODE_ENV=test backenddev npm run test:watch",
    "test:setup": "docker compose exec postgres psql -U myuser -d postgres -c 'CREATE DATABASE IF NOT EXISTS mydb_test;'"
  }
}
```

#### 5. Nouveau Service Docker (Optionnel mais Recommandé)

**Fichier** : `docker-compose.yml` (ajout)

```yaml
  backend-test:
    build:
      context: .
      dockerfile: ./backend/Dockerfile
    container_name: backend-test
    restart: "no"
    environment:
      - NODE_ENV=test
      - TZ=Europe/Paris
      - DATABASE_URL=postgresql://${POSTGRES_USER:-myuser}:${POSTGRES_PASSWORD:-mypass}@postgres:5432/mydb_test?schema=public
      - PORT=3002
    volumes:
      - ./backend:/app
      - ./shared:/app/shared
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
    command: sh -c "npx prisma migrate deploy && npm run test"
    profiles:
      - test
```

**Usage** :
```bash
# Lancer les tests dans un container dédié
docker compose --profile test run --rm backend-test

# Ou dans le container dev existant
docker compose exec backenddev npm run test
```

---

## 📝 Types de Tests à Implémenter

### 1. Tests Unitaires - Repositories

**Priorité** : HAUTE
**Coverage Target** : 80%

**Fichier** : `backend/src/domain/repositories/__tests__/character.repository.test.ts`

```typescript
import { CharacterRepository } from "../character.repository";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const repo = new CharacterRepository(prisma);

describe("CharacterRepository", () => {
  let testUserId: string;
  let testTownId: string;

  beforeEach(async () => {
    // Créer des données de test
    const user = await prisma.user.create({
      data: { discordId: "test-123", username: "Test" }
    });
    testUserId = user.id;

    const guild = await prisma.guild.create({
      data: { discordId: "guild-123", name: "Test Guild" }
    });

    const town = await prisma.town.create({
      data: {
        name: "Test Town",
        guildId: guild.id,
        isCapital: false
      }
    });
    testTownId = town.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.character.deleteMany({ where: { userId: testUserId } });
    await prisma.town.deleteMany({ where: { id: testTownId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe("findActiveCharacter", () => {
    it("should return active character", async () => {
      // Créer un personnage actif
      const job = await prisma.job.findFirst();
      const character = await prisma.character.create({
        data: {
          userId: testUserId,
          townId: testTownId,
          name: "Hero",
          isActive: true,
          isDead: false,
          jobId: job!.id,
          hp: 5,
          pm: 5,
          pa: 12,
          hungerLevel: 2
        }
      });

      const result = await repo.findActiveCharacter(testUserId, testTownId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(character.id);
      expect(result?.name).toBe("Hero");
    });

    it("should return null when no active character", async () => {
      const result = await repo.findActiveCharacter(testUserId, testTownId);
      expect(result).toBeNull();
    });

    it("should not return dead character", async () => {
      const job = await prisma.job.findFirst();
      await prisma.character.create({
        data: {
          userId: testUserId,
          townId: testTownId,
          name: "Dead Hero",
          isActive: true,
          isDead: true, // MORT
          jobId: job!.id,
          hp: 0,
          pm: 5,
          pa: 12,
          hungerLevel: 2
        }
      });

      const result = await repo.findActiveCharacter(testUserId, testTownId);
      expect(result).toBeNull();
    });
  });

  describe("deactivateOtherCharacters", () => {
    it("should deactivate all except specified character", async () => {
      const job = await prisma.job.findFirst();

      // Créer 3 personnages actifs
      const char1 = await prisma.character.create({
        data: {
          userId: testUserId,
          townId: testTownId,
          name: "Hero 1",
          isActive: true,
          isDead: false,
          jobId: job!.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      await prisma.character.create({
        data: {
          userId: testUserId,
          townId: testTownId,
          name: "Hero 2",
          isActive: true,
          isDead: false,
          jobId: job!.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      await repo.deactivateOtherCharacters(testUserId, testTownId, char1.id);

      const characters = await prisma.character.findMany({
        where: { userId: testUserId, townId: testTownId }
      });

      const activeCount = characters.filter(c => c.isActive).length;
      expect(activeCount).toBe(1);
      expect(characters.find(c => c.id === char1.id)?.isActive).toBe(true);
    });
  });
});
```

**Repositories à tester** :
- ✅ `character.repository.ts` (priorité 1)
- ✅ `resource.repository.ts` (priorité 1)
- ✅ `expedition.repository.ts` (priorité 2)
- ✅ `chantier.repository.ts` (priorité 2)
- ✅ `project.repository.ts` (priorité 3)

---

### 2. Tests Unitaires - Services

**Priorité** : HAUTE
**Coverage Target** : 80%

**Fichier** : `backend/src/services/__tests__/character.service.test.ts`

```typescript
import { CharacterService } from "../character.service";
import { CharacterRepository } from "../../domain/repositories/character.repository";
import { NotFoundError } from "../../shared/errors/not-found-error";

// Mock du repository
jest.mock("../../domain/repositories/character.repository");

describe("CharacterService", () => {
  let service: CharacterService;
  let mockRepo: jest.Mocked<CharacterRepository>;

  beforeEach(() => {
    mockRepo = new CharacterRepository(null as any) as jest.Mocked<CharacterRepository>;
    service = new CharacterService(mockRepo);
  });

  describe("getActiveCharacter", () => {
    it("should return character when found", async () => {
      const mockCharacter = {
        id: "char-123",
        name: "Hero",
        userId: "user-123",
        townId: "town-123",
        isActive: true,
        isDead: false
      };

      mockRepo.findActiveCharacter.mockResolvedValue(mockCharacter as any);

      const result = await service.getActiveCharacter("user-123", "town-123");

      expect(result).toEqual(mockCharacter);
      expect(mockRepo.findActiveCharacter).toHaveBeenCalledWith("user-123", "town-123");
    });

    it("should throw NotFoundError when character not found", async () => {
      mockRepo.findActiveCharacter.mockResolvedValue(null);

      await expect(
        service.getActiveCharacter("user-123", "town-123")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("createCharacter", () => {
    it("should deactivate other characters before creating new one", async () => {
      const mockCharacter = {
        id: "new-char-123",
        name: "New Hero"
      };

      mockRepo.deactivateOtherCharacters.mockResolvedValue({ count: 2 });
      mockRepo.create.mockResolvedValue(mockCharacter as any);

      const result = await service.createCharacter({
        userId: "user-123",
        townId: "town-123",
        name: "New Hero",
        jobId: 1
      });

      expect(mockRepo.deactivateOtherCharacters).toHaveBeenCalledWith(
        "user-123",
        "town-123"
      );
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toEqual(mockCharacter);
    });
  });
});
```

**Services à tester** :
- ✅ `character.service.ts` (priorité 1)
- ✅ `resource.service.ts` (priorité 1)
- ✅ `expedition.service.ts` (priorité 2)
- ✅ `chantier.service.ts` (priorité 2)

---

### 3. Tests d'Intégration - API Endpoints

**Priorité** : MOYENNE
**Coverage Target** : 70%

**Fichier** : `backend/src/controllers/__tests__/character.controller.test.ts`

```typescript
import request from "supertest";
import { app } from "../../app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Character API", () => {
  let testUserId: string;
  let testTownId: string;
  let testDiscordId: string;

  beforeAll(async () => {
    // Setup test data
    const user = await prisma.user.create({
      data: { discordId: "integration-test-123", username: "IntegrationTest" }
    });
    testUserId = user.id;
    testDiscordId = user.discordId;

    const guild = await prisma.guild.create({
      data: { discordId: "guild-integration-123", name: "Integration Guild" }
    });

    const town = await prisma.town.create({
      data: { name: "Integration Town", guildId: guild.id, isCapital: false }
    });
    testTownId = town.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.character.deleteMany({ where: { userId: testUserId } });
    await prisma.town.deleteMany({ where: { id: testTownId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe("GET /api/characters/:discordId/:townId", () => {
    it("should return 404 when no active character", async () => {
      const response = await request(app)
        .get(`/api/characters/${testDiscordId}/${testTownId}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return active character", async () => {
      const job = await prisma.job.findFirst();

      // Créer un personnage actif
      await prisma.character.create({
        data: {
          userId: testUserId,
          townId: testTownId,
          name: "Integration Hero",
          isActive: true,
          isDead: false,
          jobId: job!.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const response = await request(app)
        .get(`/api/characters/${testDiscordId}/${testTownId}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Integration Hero");
      expect(response.body.user.discordId).toBe(testDiscordId);
    });
  });

  describe("POST /api/characters", () => {
    it("should create new character", async () => {
      const job = await prisma.job.findFirst();

      const response = await request(app)
        .post("/api/characters")
        .send({
          userId: testUserId,
          townId: testTownId,
          name: "New Integration Hero",
          jobId: job!.id
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("New Integration Hero");
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app)
        .post("/api/characters")
        .send({
          userId: "invalid",
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
```

**Endpoints prioritaires à tester** :
1. `GET /api/characters/:discordId/:townId` - Get active character
2. `POST /api/characters` - Create character
3. `PATCH /api/characters/:id/stats` - Update stats
4. `GET /api/resources/:locationType/:locationId` - Get stocks
5. `POST /api/expeditions` - Create expedition

---

### 4. Tests Utilities

**Priorité** : HAUTE
**Coverage Target** : 90%

**Fichier** : `backend/src/shared/utils/__tests__/character.utils.test.ts`

```typescript
import { CharacterUtils } from "../character.utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("CharacterUtils", () => {
  describe("getActiveCharacterOrThrow", () => {
    it("should throw error when character not found", async () => {
      await expect(
        CharacterUtils.getActiveCharacterOrThrow("nonexistent", "town-123")
      ).rejects.toThrow("No active character found");
    });

    // Test avec données réelles dans beforeEach/afterEach
  });
});
```

---

## 🚀 Plan d'Implémentation

### Étape 1 : Setup Infrastructure (1h)

```bash
# 1. Créer la base de test
docker compose exec postgres psql -U myuser -d postgres -c "CREATE DATABASE mydb_test;"

# 2. Vérifier
docker compose exec postgres psql -U myuser -c "\l" | grep mydb_test

# 3. Tester la connexion
docker compose exec -e DATABASE_URL="postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public" backenddev npx prisma migrate deploy
```

### Étape 2 : Améliorer setup.ts (30min)

- Ajouter seed minimal
- Ajouter cleanup automatique
- Ajouter logging

### Étape 3 : Tests Repositories (6-8h)

Ordre :
1. `character.repository.test.ts` (2h)
2. `resource.repository.test.ts` (1h30)
3. `expedition.repository.test.ts` (1h30)
4. `chantier.repository.test.ts` (1h30)
5. `project.repository.test.ts` (1h)

### Étape 4 : Tests Services (4-6h)

Ordre :
1. `character.service.test.ts` (2h)
2. `resource.service.test.ts` (1h)
3. `expedition.service.test.ts` (1h30)
4. `chantier.service.test.ts` (1h)

### Étape 5 : Tests Utilities (2h)

- `character.utils.test.ts`
- `resource.utils.test.ts`

### Étape 6 : Tests API (4-5h)

- `character.controller.test.ts` (2h)
- `resource.controller.test.ts` (1h)
- `expedition.controller.test.ts` (1h30)

### Étape 7 : Coverage & Refining (2h)

```bash
# Vérifier coverage
docker compose exec backenddev npm run test:coverage

# Identifier les zones non couvertes
# Ajouter tests manquants
```

---

## 📊 Commandes Utiles

```bash
# Setup initial
npm run test:setup

# Lancer tous les tests
docker compose exec backenddev npm run test

# Lancer tests en watch mode
docker compose exec backenddev npm run test:watch

# Coverage report
docker compose exec backenddev npm run test:coverage

# Lancer un fichier spécifique
docker compose exec backenddev npm test -- character.repository.test.ts

# Lancer avec pattern
docker compose exec backenddev npm test -- --testPathPattern=repositories

# Debug mode
docker compose exec backenddev node --inspect-brk=0.0.0.0:9229 node_modules/.bin/jest --runInBand
```

---

## ✅ Checklist Phase 9

### Infrastructure
- [ ] Créer base `mydb_test` dans PostgreSQL
- [ ] Tester connexion depuis container backend
- [ ] Améliorer `src/__tests__/setup.ts`
- [ ] Ajouter script `test:setup` dans package.json

### Tests Repositories (14 repos)
- [ ] character.repository.test.ts (priorité 1)
- [ ] resource.repository.test.ts (priorité 1)
- [ ] expedition.repository.test.ts (priorité 2)
- [ ] chantier.repository.test.ts (priorité 2)
- [ ] project.repository.test.ts (priorité 3)
- [ ] capability.repository.test.ts
- [ ] object.repository.test.ts
- [ ] job.repository.test.ts
- [ ] town.repository.test.ts
- [ ] guild.repository.test.ts

### Tests Services
- [ ] character.service.test.ts
- [ ] resource.service.test.ts
- [ ] expedition.service.test.ts
- [ ] chantier.service.test.ts
- [ ] project.service.test.ts

### Tests Utilities
- [ ] character.utils.test.ts
- [ ] resource.utils.test.ts
- [ ] text-formatters.test.ts

### Tests API
- [ ] character.controller.test.ts
- [ ] resource.controller.test.ts
- [ ] expedition.controller.test.ts

### Coverage
- [ ] Atteindre >70% global coverage
- [ ] Atteindre >80% repositories
- [ ] Atteindre >80% services
- [ ] Atteindre >90% utilities

---

## 🎯 Résultat Attendu

**Métriques** :
- ✅ 50+ tests unitaires
- ✅ 20+ tests d'intégration
- ✅ Coverage >70% global
- ✅ 0 erreurs de tests
- ✅ Temps d'exécution <30s

**Bénéfices** :
- 🛡️ Protection contre les régressions
- 📚 Documentation vivante du code
- 🚀 Confiance pour refactorer
- ✅ Validation des repositories et services

---

## 💡 Recommandation Finale

**Option A++ (Tests DANS container avec BDD séparée)** est le meilleur compromis :

✅ **À faire** :
- Tests dans le container backend existant
- Base de données `mydb_test` séparée
- Seed minimal automatique
- Cleanup automatique entre tests

❌ **À éviter** :
- SQLite (différences SQL)
- Tests hors Docker (config complexe)
- Partager la BDD dev (risque de pollution)

**Temps estimé total** : 12-15 heures
**Priorité** : Moyenne (backend déjà production-ready sans tests)

---

**Prochaine action** : Décider si on implémente maintenant ou après déploiement initial.
