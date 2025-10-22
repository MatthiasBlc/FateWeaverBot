# Phase 9 - Exemples de Tests Prêts à l'Emploi

**Date**: 2025-10-22

---

## 📁 Structure des Tests

```
backend/src/
├── __tests__/
│   └── setup.ts                           (✅ Existe)
├── domain/
│   └── repositories/
│       └── __tests__/
│           ├── character.repository.test.ts    (À créer)
│           ├── resource.repository.test.ts     (À créer)
│           └── expedition.repository.test.ts   (À créer)
├── services/
│   └── __tests__/
│       ├── character.service.test.ts           (À créer)
│       └── resource.service.test.ts            (À créer)
├── shared/
│   └── utils/
│       └── __tests__/
│           ├── character.utils.test.ts         (À créer)
│           └── resource.utils.test.ts          (À créer)
└── controllers/
    └── __tests__/
        └── character.controller.test.ts        (À créer)
```

---

## 🔧 1. Setup Amélioré

**Fichier** : `backend/src/__tests__/setup.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public"
    }
  },
  log: process.env.DEBUG_TESTS ? ["query", "error", "warn"] : ["error"]
});

// Variables globales pour les tests
export let testGuild: { id: string; discordId: string };
export let testTown: { id: string };
export let testUser: { id: string; discordId: string };
export let testJob: { id: number };

beforeAll(async () => {
  console.log("🧪 Test suite starting...");
  console.log("📊 Database:", process.env.DATABASE_URL);

  // Appliquer les migrations
  try {
    execSync("npx prisma migrate deploy", {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public"
      },
      stdio: "inherit"
    });
    console.log("✅ Migrations applied");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }

  // Seed minimal pour TOUS les tests
  await seedCommonTestData();
  console.log("✅ Common test data seeded");
});

afterAll(async () => {
  console.log("🧹 Cleaning up test data...");

  // Cleanup : supprimer toutes les données de test
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
        );
      } catch (error) {
        console.log(`⚠️  Could not truncate ${tablename}`);
      }
    }
  }

  await prisma.$disconnect();
  console.log("✅ Test suite completed");
});

// Seed de données communes à TOUS les tests
async function seedCommonTestData() {
  // Guild de test
  testGuild = await prisma.guild.upsert({
    where: { discordId: "test-guild-common" },
    update: {},
    create: {
      discordId: "test-guild-common",
      name: "Common Test Guild"
    }
  });

  // Town de test
  testTown = await prisma.town.upsert({
    where: {
      guildId_name: {
        guildId: testGuild.id,
        name: "Common Test Town"
      }
    },
    update: {},
    create: {
      name: "Common Test Town",
      guildId: testGuild.id,
      isCapital: false,
      latitude: 0,
      longitude: 0
    }
  });

  // User de test
  testUser = await prisma.user.upsert({
    where: { discordId: "test-user-common" },
    update: {},
    create: {
      discordId: "test-user-common",
      username: "CommonTestUser"
    }
  });

  // Job par défaut (on prend le premier)
  testJob = (await prisma.job.findFirst())!;

  console.log("📦 Common test data created:", {
    guildId: testGuild.id,
    townId: testTown.id,
    userId: testUser.id,
    jobId: testJob.id
  });
}

// Helper pour nettoyer entre les tests d'un même fichier
export async function cleanupCharacters() {
  await prisma.character.deleteMany({});
}

export async function cleanupExpeditions() {
  await prisma.emergencyVote.deleteMany({});
  await prisma.expeditionMember.deleteMany({});
  await prisma.expedition.deleteMany({});
}

export async function cleanupResources() {
  await prisma.resourceStock.deleteMany({});
}

export { prisma };
```

---

## 🧪 2. Tests Repository - Exemple Complet

**Fichier** : `backend/src/domain/repositories/__tests__/character.repository.test.ts`

```typescript
import { CharacterRepository } from "../character.repository";
import { prisma, testUser, testTown, testJob, cleanupCharacters } from "../../../__tests__/setup";

describe("CharacterRepository", () => {
  let repo: CharacterRepository;

  beforeAll(() => {
    repo = new CharacterRepository(prisma);
  });

  afterEach(async () => {
    await cleanupCharacters();
  });

  describe("findById", () => {
    it("should return character with full relations", async () => {
      // Arrange
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Test Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5,
          pm: 5,
          pa: 12,
          hungerLevel: 2
        }
      });

      // Act
      const result = await repo.findById(character.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(character.id);
      expect(result?.name).toBe("Test Hero");
      expect(result?.user).toBeDefined();
      expect(result?.town).toBeDefined();
      expect(result?.job).toBeDefined();
    });

    it("should return null for non-existent id", async () => {
      const result = await repo.findById("00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });
  });

  describe("findActiveCharacter", () => {
    it("should return active character", async () => {
      await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Active Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const result = await repo.findActiveCharacter(testUser.id, testTown.id);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Active Hero");
      expect(result?.isActive).toBe(true);
      expect(result?.isDead).toBe(false);
    });

    it("should return null when no active character", async () => {
      const result = await repo.findActiveCharacter(testUser.id, testTown.id);
      expect(result).toBeNull();
    });

    it("should not return inactive character", async () => {
      await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Inactive Hero",
          isActive: false, // INACTIF
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const result = await repo.findActiveCharacter(testUser.id, testTown.id);
      expect(result).toBeNull();
    });

    it("should not return dead character", async () => {
      await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Dead Hero",
          isActive: true,
          isDead: true, // MORT
          jobId: testJob.id,
          hp: 0, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const result = await repo.findActiveCharacter(testUser.id, testTown.id);
      expect(result).toBeNull();
    });

    it("should return correct character when multiple exist", async () => {
      // Créer un personnage inactif
      await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Old Hero",
          isActive: false,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      // Créer un personnage actif
      await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Current Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const result = await repo.findActiveCharacter(testUser.id, testTown.id);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Current Hero");
    });
  });

  describe("create", () => {
    it("should create character with full relations", async () => {
      const result = await repo.create({
        name: "New Hero",
        user: { connect: { id: testUser.id } },
        town: { connect: { id: testTown.id } },
        job: { connect: { id: testJob.id } },
        isActive: true,
        isDead: false,
        hp: 5,
        pm: 5,
        pa: 12,
        hungerLevel: 2
      });

      expect(result).toHaveProperty("id");
      expect(result.name).toBe("New Hero");
      expect(result.user).toBeDefined();
      expect(result.town).toBeDefined();
      expect(result.job).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update character stats", async () => {
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Hero to Update",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const result = await repo.update(character.id, {
        hp: 3,
        pm: 2
      });

      expect(result.hp).toBe(3);
      expect(result.pm).toBe(2);
      expect(result.name).toBe("Hero to Update"); // Unchanged
    });
  });

  describe("deactivateOtherCharacters", () => {
    it("should deactivate all characters except specified one", async () => {
      const char1 = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Hero 1",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const char2 = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Hero 2",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const char3 = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Hero 3",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      // Deactivate all except char2
      const result = await repo.deactivateOtherCharacters(
        testUser.id,
        testTown.id,
        char2.id
      );

      expect(result.count).toBe(2); // char1 and char3

      const characters = await prisma.character.findMany({
        where: { userId: testUser.id, townId: testTown.id }
      });

      const char1Updated = characters.find(c => c.id === char1.id);
      const char2Updated = characters.find(c => c.id === char2.id);
      const char3Updated = characters.find(c => c.id === char3.id);

      expect(char1Updated?.isActive).toBe(false);
      expect(char2Updated?.isActive).toBe(true); // Still active
      expect(char3Updated?.isActive).toBe(false);
    });

    it("should deactivate all when no exception specified", async () => {
      await prisma.character.createMany({
        data: [
          {
            userId: testUser.id,
            townId: testTown.id,
            name: "Hero 1",
            isActive: true,
            isDead: false,
            jobId: testJob.id,
            hp: 5, pm: 5, pa: 12, hungerLevel: 2
          },
          {
            userId: testUser.id,
            townId: testTown.id,
            name: "Hero 2",
            isActive: true,
            isDead: false,
            jobId: testJob.id,
            hp: 5, pm: 5, pa: 12, hungerLevel: 2
          }
        ]
      });

      const result = await repo.deactivateOtherCharacters(
        testUser.id,
        testTown.id
      );

      expect(result.count).toBe(2);

      const activeCount = await prisma.character.count({
        where: {
          userId: testUser.id,
          townId: testTown.id,
          isActive: true
        }
      });

      expect(activeCount).toBe(0);
    });
  });

  describe("addCapability", () => {
    it("should add capability to character", async () => {
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const capability = await prisma.capability.findFirst();

      const result = await repo.addCapability(character.id, capability!.id);

      expect(result.characterId).toBe(character.id);
      expect(result.capabilityId).toBe(capability!.id);
    });
  });

  describe("getCapabilities", () => {
    it("should return capabilities sorted by name", async () => {
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const capabilities = await prisma.capability.findMany({ take: 3 });

      // Ajouter 3 capabilities
      for (const cap of capabilities) {
        await prisma.characterCapability.create({
          data: {
            characterId: character.id,
            capabilityId: cap.id
          }
        });
      }

      const result = await repo.getCapabilities(character.id);

      expect(result).toHaveLength(3);
      expect(result[0].capability).toBeDefined();

      // Vérifier tri par nom
      const names = result.map(cc => cc.capability.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it("should return empty array when no capabilities", async () => {
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const result = await repo.getCapabilities(character.id);
      expect(result).toEqual([]);
    });
  });
});
```

---

## 🧪 3. Tests Service avec Mocks

**Fichier** : `backend/src/services/__tests__/character.service.test.ts`

```typescript
import { CharacterService } from "../character.service";
import { CharacterRepository } from "../../domain/repositories/character.repository";
import { NotFoundError } from "../../shared/errors/not-found-error";

// Mock complet du repository
jest.mock("../../domain/repositories/character.repository");

describe("CharacterService", () => {
  let service: CharacterService;
  let mockRepo: jest.Mocked<CharacterRepository>;

  beforeEach(() => {
    // Créer un mock du repository
    mockRepo = {
      findById: jest.fn(),
      findActiveCharacter: jest.fn(),
      findUserByDiscordId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deactivateOtherCharacters: jest.fn(),
      addCapability: jest.fn(),
      getCapabilities: jest.fn()
    } as any;

    service = new CharacterService(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getActiveCharacter", () => {
    it("should return character when found", async () => {
      const mockCharacter = {
        id: "char-123",
        name: "Hero",
        userId: "user-123",
        townId: "town-123",
        isActive: true,
        isDead: false,
        hp: 5,
        pm: 5,
        pa: 12
      };

      mockRepo.findActiveCharacter.mockResolvedValue(mockCharacter as any);

      const result = await service.getActiveCharacter("user-123", "town-123");

      expect(result).toEqual(mockCharacter);
      expect(mockRepo.findActiveCharacter).toHaveBeenCalledWith("user-123", "town-123");
      expect(mockRepo.findActiveCharacter).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError when character not found", async () => {
      mockRepo.findActiveCharacter.mockResolvedValue(null);

      await expect(
        service.getActiveCharacter("user-123", "town-123")
      ).rejects.toThrow(NotFoundError);

      expect(mockRepo.findActiveCharacter).toHaveBeenCalledWith("user-123", "town-123");
    });
  });

  describe("createCharacter", () => {
    it("should deactivate others and create new character", async () => {
      const mockCharacter = {
        id: "new-char-123",
        name: "New Hero",
        userId: "user-123",
        townId: "town-123",
        isActive: true
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
        "town-123",
        undefined
      );
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toEqual(mockCharacter);
    });

    it("should handle creation failure", async () => {
      mockRepo.deactivateOtherCharacters.mockResolvedValue({ count: 0 });
      mockRepo.create.mockRejectedValue(new Error("Database error"));

      await expect(
        service.createCharacter({
          userId: "user-123",
          townId: "town-123",
          name: "New Hero",
          jobId: 1
        })
      ).rejects.toThrow("Database error");
    });
  });

  describe("updateStats", () => {
    it("should update character stats", async () => {
      const mockCharacter = {
        id: "char-123",
        hp: 3,
        pm: 2
      };

      mockRepo.update.mockResolvedValue(mockCharacter as any);

      const result = await service.updateStats("char-123", { hp: 3, pm: 2 });

      expect(mockRepo.update).toHaveBeenCalledWith("char-123", { hp: 3, pm: 2 });
      expect(result.hp).toBe(3);
      expect(result.pm).toBe(2);
    });

    it("should validate stats bounds", async () => {
      await expect(
        service.updateStats("char-123", { hp: 10 }) // Max is 5
      ).rejects.toThrow();
    });
  });

  describe("addCapabilityToCharacter", () => {
    it("should add capability", async () => {
      const mockResult = {
        characterId: "char-123",
        capabilityId: "cap-123"
      };

      mockRepo.addCapability.mockResolvedValue(mockResult as any);

      const result = await service.addCapabilityToCharacter("char-123", "cap-123");

      expect(mockRepo.addCapability).toHaveBeenCalledWith("char-123", "cap-123");
      expect(result).toEqual(mockResult);
    });

    it("should handle duplicate capability error", async () => {
      mockRepo.addCapability.mockRejectedValue(
        new Error("Unique constraint failed")
      );

      await expect(
        service.addCapabilityToCharacter("char-123", "cap-123")
      ).rejects.toThrow();
    });
  });
});
```

---

## 🧪 4. Tests API - Intégration

**Fichier** : `backend/src/controllers/__tests__/character.controller.test.ts`

```typescript
import request from "supertest";
import { app } from "../../app";
import { prisma, testUser, testTown, testJob, testGuild, cleanupCharacters } from "../../__tests__/setup";

describe("Character API", () => {
  afterEach(async () => {
    await cleanupCharacters();
  });

  describe("GET /api/characters/:discordId/:townId", () => {
    it("should return 404 when no active character", async () => {
      const response = await request(app)
        .get(`/api/characters/${testUser.discordId}/${testTown.id}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("not found");
    });

    it("should return active character with full relations", async () => {
      // Créer un personnage actif
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "API Test Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const response = await request(app)
        .get(`/api/characters/${testUser.discordId}/${testTown.id}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", character.id);
      expect(response.body).toHaveProperty("name", "API Test Hero");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.discordId).toBe(testUser.discordId);
      expect(response.body).toHaveProperty("town");
      expect(response.body.town.name).toBe("Common Test Town");
      expect(response.body).toHaveProperty("job");
    });

    it("should return 400 for invalid discordId", async () => {
      const response = await request(app)
        .get(`/api/characters/invalid//${testTown.id}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/characters", () => {
    it("should create new character", async () => {
      const response = await request(app)
        .post("/api/characters")
        .send({
          userId: testUser.id,
          townId: testTown.id,
          name: "Brand New Hero",
          jobId: testJob.id
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Brand New Hero");
      expect(response.body.isActive).toBe(true);
      expect(response.body.isDead).toBe(false);

      // Vérifier en BDD
      const dbCharacter = await prisma.character.findUnique({
        where: { id: response.body.id }
      });
      expect(dbCharacter).not.toBeNull();
    });

    it("should deactivate previous character", async () => {
      // Créer un premier personnage
      const oldChar = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Old Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      // Créer un nouveau via API
      await request(app)
        .post("/api/characters")
        .send({
          userId: testUser.id,
          townId: testTown.id,
          name: "New Hero",
          jobId: testJob.id
        })
        .expect(201);

      // Vérifier que l'ancien est désactivé
      const oldCharUpdated = await prisma.character.findUnique({
        where: { id: oldChar.id }
      });
      expect(oldCharUpdated?.isActive).toBe(false);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/characters")
        .send({
          userId: testUser.id
          // Missing townId, name, jobId
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid userId format", async () => {
      const response = await request(app)
        .post("/api/characters")
        .send({
          userId: "not-a-uuid",
          townId: testTown.id,
          name: "Hero",
          jobId: testJob.id
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PATCH /api/characters/:id/stats", () => {
    let characterId: string;

    beforeEach(async () => {
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Stats Test Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });
      characterId = character.id;
    });

    it("should update character stats", async () => {
      const response = await request(app)
        .patch(`/api/characters/${characterId}/stats`)
        .send({
          hp: 3,
          pm: 2
        })
        .expect(200);

      expect(response.body.hp).toBe(3);
      expect(response.body.pm).toBe(2);
    });

    it("should return 400 for stats out of bounds", async () => {
      const response = await request(app)
        .patch(`/api/characters/${characterId}/stats`)
        .send({
          hp: 10 // Max is 5
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 for non-existent character", async () => {
      await request(app)
        .patch("/api/characters/00000000-0000-0000-0000-000000000000/stats")
        .send({ hp: 3 })
        .expect(404);
    });
  });

  describe("POST /api/characters/:id/capabilities", () => {
    let characterId: string;
    let capabilityId: string;

    beforeEach(async () => {
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Capability Test Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });
      characterId = character.id;

      const capability = await prisma.capability.findFirst();
      capabilityId = capability!.id;
    });

    it("should add capability to character", async () => {
      const response = await request(app)
        .post(`/api/characters/${characterId}/capabilities`)
        .send({ capabilityId })
        .expect(201);

      expect(response.body.characterId).toBe(characterId);
      expect(response.body.capabilityId).toBe(capabilityId);
    });

    it("should return 409 when capability already added", async () => {
      // Ajouter une première fois
      await request(app)
        .post(`/api/characters/${characterId}/capabilities`)
        .send({ capabilityId })
        .expect(201);

      // Essayer d'ajouter à nouveau
      await request(app)
        .post(`/api/characters/${characterId}/capabilities`)
        .send({ capabilityId })
        .expect(409);
    });
  });
});
```

---

## 🧪 5. Tests Utilities

**Fichier** : `backend/src/shared/utils/__tests__/character.utils.test.ts`

```typescript
import { CharacterUtils } from "../character.utils";
import { prisma, testUser, testTown, testJob, cleanupCharacters } from "../../../__tests__/setup";

describe("CharacterUtils", () => {
  afterEach(async () => {
    await cleanupCharacters();
  });

  describe("getActiveCharacterOrThrow", () => {
    it("should return active character", async () => {
      const character = await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Utils Test Hero",
          isActive: true,
          isDead: false,
          jobId: testJob.id,
          hp: 5, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      const result = await CharacterUtils.getActiveCharacterOrThrow(
        testUser.id,
        testTown.id
      );

      expect(result.id).toBe(character.id);
      expect(result.name).toBe("Utils Test Hero");
    });

    it("should throw error when no active character", async () => {
      await expect(
        CharacterUtils.getActiveCharacterOrThrow(testUser.id, testTown.id)
      ).rejects.toThrow("No active character found");
    });

    it("should throw error when character is dead", async () => {
      await prisma.character.create({
        data: {
          userId: testUser.id,
          townId: testTown.id,
          name: "Dead Hero",
          isActive: true,
          isDead: true,
          jobId: testJob.id,
          hp: 0, pm: 5, pa: 12, hungerLevel: 2
        }
      });

      await expect(
        CharacterUtils.getActiveCharacterOrThrow(testUser.id, testTown.id)
      ).rejects.toThrow("No active character found");
    });
  });

  describe("getUserByDiscordIdOrThrow", () => {
    it("should return user when found", async () => {
      const result = await CharacterUtils.getUserByDiscordIdOrThrow(
        testUser.discordId
      );

      expect(result.id).toBe(testUser.id);
      expect(result.discordId).toBe(testUser.discordId);
    });

    it("should throw error when user not found", async () => {
      await expect(
        CharacterUtils.getUserByDiscordIdOrThrow("nonexistent-discord-id")
      ).rejects.toThrow("User not found");
    });
  });
});
```

---

## 🚀 Commandes Rapides

```bash
# Setup initial
docker compose exec backenddev npm run test:setup

# Lancer TOUS les tests
docker compose exec backenddev npm test

# Lancer un fichier spécifique
docker compose exec backenddev npm test -- character.repository

# Lancer en watch mode (développement)
docker compose exec backenddev npm run test:watch

# Coverage complet
docker compose exec backenddev npm run test:coverage

# Lancer uniquement les tests Repository
docker compose exec backenddev npm test -- --testPathPattern=repositories

# Lancer uniquement les tests Service
docker compose exec backenddev npm test -- --testPathPattern=services

# Lancer uniquement les tests API
docker compose exec backenddev npm test -- --testPathPattern=controllers

# Debug verbose
docker compose exec -e DEBUG_TESTS=true backenddev npm test
```

---

## ✅ Checklist d'Implémentation

### Setup (30 min)
- [ ] Améliorer `src/__tests__/setup.ts`
- [ ] Créer base `mydb_test`
- [ ] Tester seed automatique
- [ ] Vérifier cleanup

### Tests Repositories (6-8h)
- [ ] `character.repository.test.ts` (priorité 1)
- [ ] `resource.repository.test.ts` (priorité 1)
- [ ] `expedition.repository.test.ts`

### Tests Services (4-6h)
- [ ] `character.service.test.ts`
- [ ] `resource.service.test.ts`

### Tests API (3-4h)
- [ ] `character.controller.test.ts`

### Coverage (1h)
- [ ] Atteindre >70% coverage global
- [ ] Documenter zones non couvertes

---

**Temps total estimé** : 14-20 heures
**Priorité** : Moyenne (optionnel, backend déjà production-ready)
