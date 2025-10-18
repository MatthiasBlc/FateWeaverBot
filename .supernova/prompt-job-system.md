# 🎯 MISSION: Implémentation du système de métiers (Jobs)

## 📋 CONTEXTE

Implémentation complète d'un système de métiers pour FateWeaverBot basé sur les spécifications de `docs/doing.md`.

**Validations obtenues:**
1. ✅ jobId optionnel (nullable) sur Character
2. ✅ Les 13 capacités des métiers existent déjà en seed
3. ✅ Ne plus afficher les rôles Discord dans le profil
4. ✅ Pas de logging des changements de métier (MVP)
5. ✅ Pas de coût en PA pour changer de métier (admin uniquement)

---

## 🎯 OBJECTIFS

1. Créer un modèle Job en base de données (pattern ResourcesType)
2. Ajouter 13 métiers initiaux avec leurs capacités
3. Modifier la création de personnage pour inclure la sélection de métier
4. Mettre à jour `/profil` pour afficher le métier au lieu des rôles Discord
5. Ajouter la gestion des métiers dans `/character-admin`
6. Ajouter la création de métiers dans `/new-element-admin`
7. Implémenter l'attribution/retrait automatique des capacités lors des changements de métier

---

## 📊 LISTE DES 13 MÉTIERS

| Métier | Capacité de départ | Capacité optionnelle |
|--------|-------------------|---------------------|
| Chasseuse | Chasser | null |
| Cueilleur | Cueillir | null |
| Pêcheur | Pêcher | null |
| Mineuse | Miner | null |
| Tisserand | Tisser | null |
| Forgeronne | Forger | null |
| Menuisier | Menuiser | null |
| Cuisinière | Cuisiner | null |
| Guérisseur | Soigner | null |
| Érudit | Rechercher | null |
| Cartographe | Cartographier | null |
| Météorologue | Auspice | null |
| L'Artiste | Divertir | null |

---

## 🔧 PLAN D'IMPLÉMENTATION DÉTAILLÉ

### PHASE 1: BASE DE DONNÉES (Backend)

#### 1.1 Modifier le schéma Prisma
**Fichier:** `backend/prisma/schema.prisma`

**Action 1:** Ajouter le modèle Job après le modèle Capability (ligne ~243)

```prisma
model Job {
  id                    Int                @id @default(autoincrement())
  name                  String             @unique
  description           String?
  startingAbilityId     String             @map("starting_ability_id")
  startingAbility       Capability         @relation("JobStartingAbility", fields: [startingAbilityId], references: [id], onDelete: Restrict)
  optionalAbilityId     String?            @map("optional_ability_id")
  optionalAbility       Capability?        @relation("JobOptionalAbility", fields: [optionalAbilityId], references: [id], onDelete: Restrict)
  characters            Character[]
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  @@map("jobs")
}
```

**Action 2:** Ajouter les relations dans le modèle Capability (après ligne 238)

```prisma
jobsAsStarting        Job[]              @relation("JobStartingAbility")
jobsAsOptional        Job[]              @relation("JobOptionalAbility")
```

**Action 3:** Ajouter jobId dans le modèle Character (après ligne 76)

```prisma
jobId                 Int?                  @map("job_id")
job                   Job?                  @relation(fields: [jobId], references: [id], onDelete: SetNull)
```

**Action 4:** Créer la migration
```bash
cd /home/bouloc/Repo/FateWeaverBot/backend
npx prisma migrate dev --name add_job_system
```

#### 1.2 Seeder les 13 métiers
**Fichier:** `backend/prisma/seed.ts`

**Action:** Ajouter après la création des capacités (ligne ~137), avant la création de la saison:

```typescript
// Créer les métiers si nécessaire
const existingJobs = await prisma.job.findMany();

if (existingJobs.length === 0) {
  console.log("💼 Création des métiers de base...");

  const jobsData = [
    { name: "Chasseuse", startingAbility: "Chasser", description: "Spécialiste de la chasse" },
    { name: "Cueilleur", startingAbility: "Cueillir", description: "Spécialiste de la cueillette" },
    { name: "Pêcheur", startingAbility: "Pêcher", description: "Spécialiste de la pêche" },
    { name: "Mineuse", startingAbility: "Miner", description: "Spécialiste du minage" },
    { name: "Tisserand", startingAbility: "Tisser", description: "Spécialiste du tissage" },
    { name: "Forgeronne", startingAbility: "Forger", description: "Spécialiste de la forge" },
    { name: "Menuisier", startingAbility: "Menuiser", description: "Spécialiste de la menuiserie" },
    { name: "Cuisinière", startingAbility: "Cuisiner", description: "Spécialiste de la cuisine" },
    { name: "Guérisseur", startingAbility: "Soigner", description: "Spécialiste des soins" },
    { name: "Érudit", startingAbility: "Rechercher", description: "Spécialiste de la recherche" },
    { name: "Cartographe", startingAbility: "Cartographier", description: "Spécialiste de la cartographie" },
    { name: "Météorologue", startingAbility: "Auspice", description: "Spécialiste de la météorologie" },
    { name: "L'Artiste", startingAbility: "Divertir", description: "Spécialiste du divertissement" },
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
```

**Action:** Exécuter le seed
```bash
cd /home/bouloc/Repo/FateWeaverBot/backend
npx prisma db seed
```

---

### PHASE 2: BACKEND API

#### 2.1 Créer le service Job
**Fichier:** `backend/src/services/job.service.ts` (CRÉER)

```typescript
import { PrismaClient, Job } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateJobDto {
  name: string;
  description?: string;
  startingAbilityId: string;
  optionalAbilityId?: string | null;
}

export interface UpdateJobDto {
  name?: string;
  description?: string;
  startingAbilityId?: string;
  optionalAbilityId?: string | null;
}

export const JobService = {
  /**
   * Récupérer tous les métiers
   */
  async getAllJobs(): Promise<Job[]> {
    return await prisma.job.findMany({
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Récupérer un métier par ID
   */
  async getJobById(jobId: number): Promise<Job | null> {
    return await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
    });
  },

  /**
   * Créer un nouveau métier
   */
  async createJob(data: CreateJobDto): Promise<Job> {
    // Vérifier que les capacités existent
    const startingAbility = await prisma.capability.findUnique({
      where: { id: data.startingAbilityId },
    });

    if (!startingAbility) {
      throw new Error("Starting ability not found");
    }

    if (data.optionalAbilityId) {
      const optionalAbility = await prisma.capability.findUnique({
        where: { id: data.optionalAbilityId },
      });

      if (!optionalAbility) {
        throw new Error("Optional ability not found");
      }
    }

    return await prisma.job.create({
      data: {
        name: data.name,
        description: data.description,
        startingAbilityId: data.startingAbilityId,
        optionalAbilityId: data.optionalAbilityId,
      },
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
    });
  },

  /**
   * Mettre à jour un métier
   */
  async updateJob(jobId: number, data: UpdateJobDto): Promise<Job> {
    // Vérifier que les capacités existent si fournies
    if (data.startingAbilityId) {
      const startingAbility = await prisma.capability.findUnique({
        where: { id: data.startingAbilityId },
      });

      if (!startingAbility) {
        throw new Error("Starting ability not found");
      }
    }

    if (data.optionalAbilityId) {
      const optionalAbility = await prisma.capability.findUnique({
        where: { id: data.optionalAbilityId },
      });

      if (!optionalAbility) {
        throw new Error("Optional ability not found");
      }
    }

    return await prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
    });
  },
};
```

#### 2.2 Modifier le service Character
**Fichier:** `backend/src/services/character.service.ts`

**Action 1:** Ajouter jobId dans createCharacter (ligne ~116)

Modifier la signature et l'implémentation:
```typescript
async createCharacter(
  userId: string,
  name: string,
  townId: string,
  jobId?: number // NOUVEAU
): Promise<Character> {
  // ... code existant de validation ...

  // Créer le personnage
  const character = await prisma.character.create({
    data: {
      name,
      userId,
      townId,
      jobId, // NOUVEAU
      isActive: true,
    },
  });

  // Si un métier est fourni, attribuer la capacité de départ
  if (jobId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { startingAbility: true },
    });

    if (job && job.startingAbility) {
      // Vérifier si le personnage a déjà cette capacité
      const hasCapability = await prisma.characterCapability.findUnique({
        where: {
          characterId_capabilityId: {
            characterId: character.id,
            capabilityId: job.startingAbility.id,
          },
        },
      });

      // Ajouter la capacité si elle n'existe pas
      if (!hasCapability) {
        await prisma.characterCapability.create({
          data: {
            characterId: character.id,
            capabilityId: job.startingAbility.id,
          },
        });
      }
    }
  }

  return character;
}
```

**Action 2:** Ajouter une nouvelle méthode `changeCharacterJob` (à la fin du service)

```typescript
/**
 * Changer le métier d'un personnage
 * Retire les capacités de l'ancien métier et ajoute celles du nouveau
 */
async changeCharacterJob(
  characterId: string,
  newJobId: number
): Promise<Character> {
  // Récupérer le personnage avec son métier actuel
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      job: {
        include: {
          startingAbility: true,
          optionalAbility: true,
        },
      },
    },
  });

  if (!character) {
    throw new Error("Character not found");
  }

  // Récupérer le nouveau métier
  const newJob = await prisma.job.findUnique({
    where: { id: newJobId },
    include: {
      startingAbility: true,
      optionalAbility: true,
    },
  });

  if (!newJob) {
    throw new Error("Job not found");
  }

  // Retirer les capacités de l'ancien métier
  if (character.job) {
    const oldJobAbilityIds: string[] = [];

    if (character.job.startingAbility) {
      oldJobAbilityIds.push(character.job.startingAbility.id);
    }

    if (character.job.optionalAbility) {
      oldJobAbilityIds.push(character.job.optionalAbility.id);
    }

    // Supprimer ces capacités du personnage
    await prisma.characterCapability.deleteMany({
      where: {
        characterId: character.id,
        capabilityId: { in: oldJobAbilityIds },
      },
    });
  }

  // Ajouter les capacités du nouveau métier
  const newJobAbilityIds: string[] = [];

  if (newJob.startingAbility) {
    newJobAbilityIds.push(newJob.startingAbility.id);
  }

  if (newJob.optionalAbility) {
    newJobAbilityIds.push(newJob.optionalAbility.id);
  }

  // Créer les nouvelles capacités
  for (const abilityId of newJobAbilityIds) {
    await prisma.characterCapability.upsert({
      where: {
        characterId_capabilityId: {
          characterId: character.id,
          capabilityId: abilityId,
        },
      },
      update: {},
      create: {
        characterId: character.id,
        capabilityId: abilityId,
      },
    });
  }

  // Mettre à jour le personnage avec le nouveau métier
  return await prisma.character.update({
    where: { id: characterId },
    data: { jobId: newJobId },
    include: {
      job: {
        include: {
          startingAbility: true,
          optionalAbility: true,
        },
      },
      capabilities: {
        include: {
          capability: true,
        },
      },
    },
  });
}
```

#### 2.3 Créer le contrôleur Job
**Fichier:** `backend/src/controllers/jobs.ts` (CRÉER)

```typescript
import { Request, Response } from "express";
import { JobService } from "../services/job.service";

/**
 * GET /jobs - Récupérer tous les métiers
 */
export async function getAllJobs(req: Request, res: Response) {
  try {
    const jobs = await JobService.getAllJobs();
    res.json(jobs);
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /jobs/:id - Récupérer un métier par ID
 */
export async function getJobById(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.id);
    const job = await JobService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error: any) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /jobs - Créer un nouveau métier
 */
export async function createJob(req: Request, res: Response) {
  try {
    const { name, description, startingAbilityId, optionalAbilityId } = req.body;

    if (!name || !startingAbilityId) {
      return res.status(400).json({
        error: "name and startingAbilityId are required"
      });
    }

    const job = await JobService.createJob({
      name,
      description,
      startingAbilityId,
      optionalAbilityId,
    });

    res.status(201).json(job);
  } catch (error: any) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PATCH /jobs/:id - Mettre à jour un métier
 */
export async function updateJob(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.id);
    const { name, description, startingAbilityId, optionalAbilityId } = req.body;

    const job = await JobService.updateJob(jobId, {
      name,
      description,
      startingAbilityId,
      optionalAbilityId,
    });

    res.json(job);
  } catch (error: any) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: error.message });
  }
}
```

#### 2.4 Créer les routes Job
**Fichier:** `backend/src/routes/jobs.ts` (CRÉER)

```typescript
import { Router } from "express";
import { getAllJobs, getJobById, createJob, updateJob } from "../controllers/jobs";

const router = Router();

router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.post("/", createJob);
router.patch("/:id", updateJob);

export default router;
```

#### 2.5 Enregistrer les routes Job
**Fichier:** `backend/src/routes/index.ts`

**Action:** Ajouter l'import et la route (repérer où les autres routes sont définies)

```typescript
import jobRoutes from "./jobs";

// Dans la fonction d'enregistrement des routes:
app.use("/jobs", jobRoutes);
```

#### 2.6 Modifier le contrôleur characters
**Fichier:** `backend/src/controllers/characters.ts`

**Action 1:** Modifier `upsertCharacter` pour accepter jobId (ligne ~54)

```typescript
export async function upsertCharacter(req: Request, res: Response) {
  try {
    const { userId, name, townId, jobId } = req.body; // AJOUTER jobId

    // ... validation existante ...

    // Créer le personnage avec le métier
    const character = await CharacterService.createCharacter(
      userId,
      name,
      townId,
      jobId // AJOUTER
    );

    res.status(201).json(character);
  } catch (error: any) {
    // ... gestion d'erreur existante ...
  }
}
```

**Action 2:** Ajouter une nouvelle route pour changer le métier

```typescript
/**
 * POST /characters/:id/job - Changer le métier d'un personnage
 */
export async function changeCharacterJob(req: Request, res: Response) {
  try {
    const characterId = req.params.id;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const character = await CharacterService.changeCharacterJob(
      characterId,
      jobId
    );

    res.json(character);
  } catch (error: any) {
    console.error("Error changing character job:", error);
    res.status(500).json({ error: error.message });
  }
}
```

**Action 3:** Ajouter la route dans le fichier routes (trouver le fichier qui définit les routes characters)

```typescript
router.post("/:id/job", changeCharacterJob);
```

---

### PHASE 3: BOT API CLIENT

#### 3.1 Créer le service API Job
**Fichier:** `bot/src/services/api/job-api.service.ts` (CRÉER)

```typescript
import axios from "axios";
import { BaseAPIService } from "./base-api.service";

export interface JobDto {
  id: number;
  name: string;
  description: string | null;
  startingAbilityId: string;
  optionalAbilityId: string | null;
  startingAbility?: {
    id: string;
    name: string;
    emojiTag: string;
  };
  optionalAbility?: {
    id: string;
    name: string;
    emojiTag: string;
  } | null;
}

export interface CreateJobDto {
  name: string;
  description?: string;
  startingAbilityId: string;
  optionalAbilityId?: string | null;
}

export class JobAPIService extends BaseAPIService {
  /**
   * Récupérer tous les métiers
   */
  async getAllJobs(): Promise<JobDto[]> {
    const response = await this.axiosInstance.get<JobDto[]>("/jobs");
    return response.data;
  }

  /**
   * Récupérer un métier par ID
   */
  async getJobById(jobId: number): Promise<JobDto> {
    const response = await this.axiosInstance.get<JobDto>(`/jobs/${jobId}`);
    return response.data;
  }

  /**
   * Créer un nouveau métier
   */
  async createJob(data: CreateJobDto): Promise<JobDto> {
    const response = await this.axiosInstance.post<JobDto>("/jobs", data);
    return response.data;
  }

  /**
   * Changer le métier d'un personnage
   */
  async changeCharacterJob(characterId: string, jobId: number): Promise<any> {
    const response = await this.axiosInstance.post(
      `/characters/${characterId}/job`,
      { jobId }
    );
    return response.data;
  }
}
```

#### 3.2 Exporter le service
**Fichier:** `bot/src/services/api/index.ts`

**Action:** Ajouter l'export

```typescript
export { JobAPIService } from "./job-api.service";
export type { JobDto, CreateJobDto } from "./job-api.service";
```

#### 3.3 Mettre à jour le DTO Character
**Fichier:** `bot/src/types/dto/character.dto.ts`

**Action:** Ajouter le champ job (repérer l'interface Character)

```typescript
export interface Character {
  id: string;
  name: string;
  userId: string;
  townId: string;
  jobId?: number | null; // NOUVEAU
  job?: {              // NOUVEAU
    id: number;
    name: string;
    description: string | null;
    startingAbility: {
      id: string;
      name: string;
      emojiTag: string;
    };
    optionalAbility?: {
      id: string;
      name: string;
      emojiTag: string;
    } | null;
  } | null;
  // ... autres champs existants ...
}
```

---

### PHASE 4: CRÉATION DE PERSONNAGE (Bot)

#### 4.1 Modifier les modals de création
**Fichier:** `bot/src/modals/character-modals.ts`

**Action 1:** Ajouter l'import JobAPIService en haut du fichier

```typescript
import { JobAPIService } from "../services/api/job-api.service";
```

**Action 2:** Modifier `createCharacterCreationModal` (ligne ~16)

Transformer le modal en ActionRow avec StringSelectMenu pour le métier:

```typescript
import {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputStyle
} from "discord.js";

export async function createCharacterCreationModal(): Promise<{
  modal: ModalBuilder;
  jobSelectRow: ActionRowBuilder<StringSelectMenuBuilder>;
}> {
  const jobAPIService = new JobAPIService();
  const jobs = await jobAPIService.getAllJobs();

  const modal = new ModalBuilder()
    .setCustomId("character-creation")
    .setTitle("Création de personnage");

  const nameInput = new TextInputBuilder()
    .setCustomId("character-name")
    .setLabel("Nom du personnage")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

  const nameRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  modal.addComponents(nameRow);

  // Créer le select menu pour les métiers
  const jobSelect = new StringSelectMenuBuilder()
    .setCustomId("character-job-select")
    .setPlaceholder("Choisissez votre métier")
    .addOptions(
      jobs.map((job) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${job.name} - ${job.startingAbility?.name || ""}`)
          .setValue(job.id.toString())
          .setDescription(job.description || `Métier de ${job.name}`)
      )
    );

  const jobSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(jobSelect);

  return { modal, jobSelectRow };
}
```

**IMPORTANT:** La création de personnage devra maintenant suivre un flow en 2 étapes:
1. Modal pour le nom
2. Message avec select menu pour le métier
3. Soumission finale avec nom + jobId

**Action 3:** Modifier le handler de création (chercher où `character-creation` modal est traité)

Créer un flow en 2 étapes:
- Étape 1: Recevoir le nom du modal
- Étape 2: Afficher un message avec select menu pour le métier
- Étape 3: Soumettre la création avec nom + jobId

---

### PHASE 5: AFFICHAGE DU PROFIL (Bot)

#### 5.1 Modifier l'affichage du profil
**Fichier:** `bot/src/features/users/users.handlers.ts`

**Action:** Modifier la fonction `createProfileEmbed` (ligne ~284)

Trouver la section qui affiche "Métier" et modifier:

```typescript
// AVANT (ligne ~317-319):
.addFields({
  name: "Métier",
  value: roles.length > 0 ? roles.join(", ") : "Aucun rôle",
  inline: false,
})

// APRÈS:
.addFields({
  name: "Métier",
  value: character.job ? character.job.name : "Aucun métier",
  inline: false,
})
```

**Action 2:** S'assurer que le job est inclus dans la requête API

Trouver où le personnage est récupéré et vérifier que l'API retourne le job:

```typescript
// La requête API devrait inclure le job automatiquement
// Vérifier que l'endpoint backend inclut bien le job dans la réponse
```

---

### PHASE 6: ADMIN - GESTION DES MÉTIERS (Bot)

#### 6.1 Créer les handlers de gestion des métiers
**Fichier:** `bot/src/features/admin/character-admin/character-jobs.ts` (CRÉER)

```typescript
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { JobAPIService } from "../../../services/api/job-api.service";

/**
 * Afficher le menu de sélection de métier
 */
export async function handleJobsButton(
  interaction: ButtonInteraction,
  characterId: string
) {
  try {
    const jobAPIService = new JobAPIService();
    const jobs = await jobAPIService.getAllJobs();

    const jobSelect = new StringSelectMenuBuilder()
      .setCustomId(`character-job-select:${characterId}`)
      .setPlaceholder("Choisissez un nouveau métier")
      .addOptions(
        jobs.map((job) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${job.name} - ${job.startingAbility?.name || ""}`)
            .setValue(job.id.toString())
            .setDescription(job.description || `Métier de ${job.name}`)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      jobSelect
    );

    await interaction.reply({
      content: "Sélectionnez le nouveau métier pour ce personnage:",
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error displaying job selection:", error);
    await interaction.reply({
      content: "❌ Erreur lors de l'affichage des métiers.",
      ephemeral: true,
    });
  }
}

/**
 * Traiter la sélection de métier
 */
export async function handleJobSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    // Extraire characterId du customId
    const characterId = interaction.customId.split(":")[1];
    const newJobId = parseInt(interaction.values[0]);

    const jobAPIService = new JobAPIService();

    // Changer le métier
    await jobAPIService.changeCharacterJob(characterId, newJobId);

    // Récupérer le nouveau métier pour afficher son nom
    const newJob = await jobAPIService.getJobById(newJobId);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Métier modifié")
      .setDescription(
        `Le métier du personnage a été changé pour: **${newJob.name}**\n\n` +
        `Capacité de départ: ${newJob.startingAbility?.name || "Aucune"}\n` +
        `Capacité optionnelle: ${newJob.optionalAbility?.name || "Aucune"}`
      );

    await interaction.update({
      embeds: [embed],
      components: [],
    });
  } catch (error) {
    console.error("Error changing character job:", error);
    await interaction.reply({
      content: "❌ Erreur lors du changement de métier.",
      ephemeral: true,
    });
  }
}
```

#### 6.2 Modifier le handler principal character-admin
**Fichier:** `bot/src/features/admin/character-admin.handlers.ts`

**Action:** Ajouter le routage pour les interactions de métier

Trouver où les interactions sont routées et ajouter:

```typescript
import { handleJobsButton, handleJobSelect } from "./character-admin/character-jobs";

// Dans le handler principal:
if (interaction.customId === "character-jobs-button") {
  const characterId = /* extraire du contexte */;
  await handleJobsButton(interaction as ButtonInteraction, characterId);
  return;
}

if (interaction.customId.startsWith("character-job-select:")) {
  await handleJobSelect(interaction as StringSelectMenuInteraction);
  return;
}
```

#### 6.3 Ajouter le bouton de gestion des métiers
**Fichier:** `bot/src/features/admin/character-admin.components.ts`

**Action:** Ajouter un bouton "Changer métier" dans le menu avancé

Trouver où les boutons sont créés et ajouter:

```typescript
import { ButtonBuilder, ButtonStyle } from "discord.js";

const jobButton = new ButtonBuilder()
  .setCustomId("character-jobs-button")
  .setLabel("Changer métier")
  .setStyle(ButtonStyle.Primary)
  .setEmoji("💼");

// Ajouter ce bouton dans l'ActionRow du menu avancé
```

---

### PHASE 7: ADMIN - CRÉATION DE MÉTIERS (Bot)

#### 7.1 Modifier new-element-admin
**Fichier:** `bot/src/features/admin/new-element-admin.handlers.ts`

**Action 1:** Ajouter un bouton "Créer un métier" (ligne ~50)

```typescript
const jobButton = new ButtonBuilder()
  .setCustomId("create-job-button")
  .setLabel("Créer un métier")
  .setStyle(ButtonStyle.Primary)
  .setEmoji("💼");

// Ajouter dans l'ActionRow existant
```

**Action 2:** Ajouter le handler du bouton

```typescript
export async function handleCreateJobButton(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("create-job-modal")
    .setTitle("Créer un nouveau métier");

  const nameInput = new TextInputBuilder()
    .setCustomId("job-name")
    .setLabel("Nom du métier")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

  const descriptionInput = new TextInputBuilder()
    .setCustomId("job-description")
    .setLabel("Description")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(200);

  const startingAbilityInput = new TextInputBuilder()
    .setCustomId("job-starting-ability-id")
    .setLabel("ID de la capacité de départ")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const optionalAbilityInput = new TextInputBuilder()
    .setCustomId("job-optional-ability-id")
    .setLabel("ID de la capacité optionnelle (optionnel)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
  const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(startingAbilityInput);
  const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(optionalAbilityInput);

  modal.addComponents(row1, row2, row3, row4);

  await interaction.showModal(modal);
}
```

**Action 3:** Ajouter le handler de soumission du modal

```typescript
export async function handleCreateJobModalSubmit(
  interaction: ModalSubmitInteraction
) {
  try {
    const name = interaction.fields.getTextInputValue("job-name");
    const description = interaction.fields.getTextInputValue("job-description") || undefined;
    const startingAbilityId = interaction.fields.getTextInputValue("job-starting-ability-id");
    const optionalAbilityId = interaction.fields.getTextInputValue("job-optional-ability-id") || null;

    const jobAPIService = new JobAPIService();
    const newJob = await jobAPIService.createJob({
      name,
      description,
      startingAbilityId,
      optionalAbilityId,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Métier créé")
      .setDescription(
        `Le métier **${newJob.name}** a été créé avec succès!\n\n` +
        `Description: ${newJob.description || "Aucune"}\n` +
        `Capacité de départ: ${newJob.startingAbility?.name || "Aucune"}\n` +
        `Capacité optionnelle: ${newJob.optionalAbility?.name || "Aucune"}`
      );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    await interaction.reply({
      content: "❌ Erreur lors de la création du métier. Vérifiez les IDs des capacités.",
      ephemeral: true,
    });
  }
}
```

**Action 4:** Router les interactions

Dans le fichier principal de routing, ajouter:

```typescript
if (interaction.customId === "create-job-button") {
  await handleCreateJobButton(interaction as ButtonInteraction);
  return;
}

if (interaction.customId === "create-job-modal") {
  await handleCreateJobModalSubmit(interaction as ModalSubmitInteraction);
  return;
}
```

---

## 🧪 PHASE 8: TESTS

### 8.1 Tests Backend
```bash
cd /home/bouloc/Repo/FateWeaverBot/bot
npm run build
```

Vérifier:
- ✅ Compilation TypeScript réussie
- ✅ Aucune erreur de type

### 8.2 Tests Base de données
```bash
cd /home/bouloc/Repo/FateWeaverBot/backend
npx prisma validate
npx prisma migrate status
```

### 8.3 Tests API (via Postman ou curl)
```bash
# Récupérer tous les métiers
curl http://localhost:3000/jobs

# Créer un personnage avec un métier
curl -X POST http://localhost:3000/characters \
  -H "Content-Type: application/json" \
  -d '{"userId":"...", "name":"Test", "townId":"...", "jobId":1}'

# Changer le métier d'un personnage
curl -X POST http://localhost:3000/characters/CHARACTER_ID/job \
  -H "Content-Type: application/json" \
  -d '{"jobId":2}'
```

### 8.4 Tests Bot Discord
1. Créer un nouveau personnage → vérifier le menu de sélection de métier
2. Afficher le profil → vérifier que le métier s'affiche
3. Admin: changer le métier → vérifier que les capacités changent
4. Admin: créer un nouveau métier → vérifier la création

---

## 📊 RAPPORT FINAL

Une fois tous les tests réussis, créer un rapport dans `.supernova/report-job-system.md`:

### Structure du rapport:
```markdown
# 🎉 RAPPORT: Système de métiers implémenté

## ✅ Résumé (≤300 tokens)
[Description concise des changements]

## 📁 Fichiers modifiés
[Liste avec chemins et types de modifications]

## 🔄 Migrations
[Commandes exécutées et statut]

## 🧪 Tests effectués
[Résultats des tests]

## ⚠️ Points d'attention
[Problèmes rencontrés ou limitations]

## 📝 Prochaines étapes
[Améliorations futures possibles]
```

---

## 🎯 COMMANDES IMPORTANTES

```bash
# Backend - Migrations
cd /home/bouloc/Repo/FateWeaverBot/backend
npx prisma migrate dev --name add_job_system
npx prisma db seed
npx prisma generate

# Bot - Build
cd /home/bouloc/Repo/FateWeaverBot/bot
npm run build
npm run deploy  # Deploy commands to Discord

# Docker - Logs
docker compose logs -f discord-botdev
docker compose logs -f backenddev

# Tests
cd /home/bouloc/Repo/FateWeaverBot/backend
npx prisma validate
npm test  # Si tests unitaires existent
```

---

## 📝 CHECKLIST FINALE

Avant de considérer la mission terminée:

- [ ] Modèle Job créé dans Prisma schema
- [ ] Migration exécutée avec succès
- [ ] 13 métiers seedés en base de données
- [ ] Service JobService créé
- [ ] Contrôleur et routes jobs créés
- [ ] CharacterService modifié (createCharacter + changeCharacterJob)
- [ ] JobAPIService créé côté bot
- [ ] DTO Character mis à jour
- [ ] Création de personnage avec sélection de métier
- [ ] Profil affiche le métier (pas les rôles Discord)
- [ ] Admin peut changer le métier d'un personnage
- [ ] Admin peut créer de nouveaux métiers
- [ ] Capacités automatiquement attribuées/retirées
- [ ] Compilation TypeScript réussie
- [ ] Tests manuels effectués
- [ ] Rapport final créé dans `.supernova/report-job-system.md`

---

## 🚀 COMMANDE DE DÉMARRAGE

Pour démarrer cette mission, utilisez:

```
Continue et le lien vers ce document: .supernova/prompt-job-system.md
```

---

**Document créé le:** 2025-10-16
**Crédits estimés:** ~6% restants (mission volumineuse)
**Durée estimée:** 30-45 minutes de développement
