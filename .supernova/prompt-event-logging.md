# Supernova Task: Créer le système de logging d'événements quotidiens

## Contexte

Le bot doit envoyer un message quotidien à 8h avec un récapitulatif des événements de la veille (projets terminés, chantiers terminés, ressources récoltées, expéditions parties/revenues, etc.). Pour cela, nous avons besoin d'un système centralisé qui enregistre tous ces événements au fur et à mesure.

## Objectif

Créer un système de logging d'événements qui :
1. Définit une table en base de données pour stocker les événements quotidiens
2. Fournit un service pour enregistrer facilement ces événements
3. Intègre ce logging dans les services existants (projets, chantiers, expéditions, capabilities)

## Étape 1: Schéma de base de données

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/prisma/schema.prisma`

**Action:** Ajouter à la fin du fichier (après le modèle `Season`) :

```prisma
model DailyEventLog {
  id          Int            @id @default(autoincrement())
  eventType   DailyEventType
  eventDate   DateTime       @db.Date
  townId      String?
  description String         @db.Text
  metadata    Json?
  createdAt   DateTime       @default(now())

  town Town? @relation(fields: [townId], references: [id], onDelete: Cascade)

  @@index([eventDate])
  @@index([townId, eventDate])
  @@map("daily_event_logs")
}

enum DailyEventType {
  PROJECT_COMPLETED
  CHANTIER_COMPLETED
  RESOURCE_GATHERED
  EXPEDITION_DEPARTED
  EXPEDITION_RETURNED
  EXPEDITION_EMERGENCY_RETURN
  CHARACTER_CATASTROPHIC_RETURN
}
```

**Action:** Ajouter la relation dans le modèle `Town` (trouver le modèle Town et ajouter à la fin, avant le closing brace) :

```prisma
  dailyEventLogs DailyEventLog[]
```

**Après modification, exécuter:**
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend
npx prisma migrate dev --name add_daily_event_logging
npx prisma generate
```

## Étape 2: Service de logging d'événements

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/daily-event-log.service.ts` (NOUVEAU FICHIER)

**Contenu complet:**

```typescript
import { PrismaClient, DailyEventType } from "@prisma/client";

const prisma = new PrismaClient();

export class DailyEventLogService {
  /**
   * Log a project completion event
   */
  async logProjectCompleted(
    projectId: number,
    projectName: string,
    townId: string,
    outputResourceName: string,
    outputQuantity: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyEventLog.create({
      data: {
        eventType: DailyEventType.PROJECT_COMPLETED,
        eventDate: today,
        townId,
        description: `Le projet **${projectName}** a été terminé ! Production : ${outputQuantity} ${outputResourceName}.`,
        metadata: {
          projectId,
          projectName,
          outputResourceName,
          outputQuantity,
        },
      },
    });
  }

  /**
   * Log a chantier completion event
   */
  async logChantierCompleted(
    chantierId: number,
    chantierName: string,
    townId: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyEventLog.create({
      data: {
        eventType: DailyEventType.CHANTIER_COMPLETED,
        eventDate: today,
        townId,
        description: `Le chantier **${chantierName}** a été terminé !`,
        metadata: {
          chantierId,
          chantierName,
        },
      },
    });
  }

  /**
   * Log a resource gathering event
   */
  async logResourceGathered(
    characterId: string,
    characterName: string,
    townId: string,
    resourceType: string,
    quantity: number,
    capabilityName: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyEventLog.create({
      data: {
        eventType: DailyEventType.RESOURCE_GATHERED,
        eventDate: today,
        townId,
        description: `**${characterName}** a récolté ${quantity} ${resourceType} (${capabilityName}).`,
        metadata: {
          characterId,
          characterName,
          resourceType,
          quantity,
          capabilityName,
        },
      },
    });
  }

  /**
   * Log an expedition departure event
   */
  async logExpeditionDeparted(
    expeditionId: string,
    expeditionName: string,
    townId: string,
    memberCount: number,
    duration: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyEventLog.create({
      data: {
        eventType: DailyEventType.EXPEDITION_DEPARTED,
        eventDate: today,
        townId,
        description: `L'expédition **${expeditionName}** est partie avec ${memberCount} membre(s) pour ${duration} jour(s).`,
        metadata: {
          expeditionId,
          expeditionName,
          memberCount,
          duration,
        },
      },
    });
  }

  /**
   * Log an expedition return event
   */
  async logExpeditionReturned(
    expeditionId: string,
    expeditionName: string,
    townId: string,
    resourcesSummary: { resourceName: string; quantity: number }[]
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const resourcesText = resourcesSummary.length > 0
      ? resourcesSummary.map(r => `${r.quantity} ${r.resourceName}`).join(", ")
      : "aucune ressource";

    await prisma.dailyEventLog.create({
      data: {
        eventType: DailyEventType.EXPEDITION_RETURNED,
        eventDate: today,
        townId,
        description: `L'expédition **${expeditionName}** est revenue avec : ${resourcesText}.`,
        metadata: {
          expeditionId,
          expeditionName,
          resourcesSummary,
        },
      },
    });
  }

  /**
   * Log an expedition emergency return event
   */
  async logExpeditionEmergencyReturn(
    expeditionId: string,
    expeditionName: string,
    townId: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyEventLog.create({
      data: {
        eventType: DailyEventType.EXPEDITION_EMERGENCY_RETURN,
        eventDate: today,
        townId,
        description: `⚠️ L'expédition **${expeditionName}** est revenue en urgence !`,
        metadata: {
          expeditionId,
          expeditionName,
        },
      },
    });
  }

  /**
   * Log a character catastrophic return event
   */
  async logCharacterCatastrophicReturn(
    characterId: string,
    characterName: string,
    townId: string,
    reason: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyEventLog.create({
      data: {
        eventType: DailyEventType.CHARACTER_CATASTROPHIC_RETURN,
        eventDate: today,
        townId,
        description: `💀 **${characterName}** est rentré en catastrophe ! Raison : ${reason}`,
        metadata: {
          characterId,
          characterName,
          reason,
        },
      },
    });
  }

  /**
   * Get all events for a specific date and town
   */
  async getEventsByDateAndTown(date: Date, townId: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return await prisma.dailyEventLog.findMany({
      where: {
        eventDate: targetDate,
        townId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * Get yesterday's events for a town
   */
  async getYesterdayEvents(townId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    return await this.getEventsByDateAndTown(yesterday, townId);
  }
}

export const dailyEventLogService = new DailyEventLogService();
```

## Étape 3: Intégration dans les services existants

### 3.1 Service Projets

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/project.service.ts`

**Action 1:** Ajouter l'import en haut du fichier (après les autres imports) :
```typescript
import { dailyEventLogService } from "./daily-event-log.service";
```

**Action 2:** Dans la méthode `contributeToProject()`, trouver la section où le projet est marqué comme COMPLETED (autour de la ligne 246-272, chercher `status: ProjectStatus.COMPLETED`).

Après le bloc qui ajoute les ressources au stock de la ville (après le `tx.resourceStock.upsert`), ajouter :

```typescript
        // Log project completion
        await dailyEventLogService.logProjectCompleted(
          projectId,
          project.name,
          project.townId,
          project.outputResourceType.name,
          project.outputQuantity
        );
```

### 3.2 Service Chantiers

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/chantier.service.ts`

**Action 1:** Ajouter l'import en haut du fichier :
```typescript
import { dailyEventLogService } from "./daily-event-log.service";
```

**Action 2:** Dans la méthode `contributeResources()`, trouver la section où le chantier est marqué comme COMPLETED (autour de la ligne 263-279, chercher `status: ChantierStatus.COMPLETED`).

Après le bloc `tx.chantier.update`, ajouter :

```typescript
        // Log chantier completion
        await dailyEventLogService.logChantierCompleted(
          chantierId,
          chantier.name,
          chantier.townId
        );
```

### 3.3 Service Capabilities

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/capability.service.ts`

**Action 1:** Ajouter l'import en haut du fichier :
```typescript
import { dailyEventLogService } from "./daily-event-log.service";
```

**Action 2:** Dans la méthode `executeHarvestCapacity()` (ligne 258-323), après le bloc qui ajoute les ressources au stock (après le `tx.resourceStock.upsert`), ajouter :

```typescript
        // Log resource gathering
        await dailyEventLogService.logResourceGathered(
          characterId,
          character.name,
          character.townId,
          resourceType.name,
          totalQuantity,
          capability.name
        );
```

**Action 3:** Dans la méthode `executeBûcheronner()` (ligne 328-411), après le bloc qui ajoute le bois au stock, ajouter :

```typescript
        // Log resource gathering
        await dailyEventLogService.logResourceGathered(
          characterId,
          character.name,
          character.townId,
          "Bois",
          totalQuantity,
          "Bûcheronner"
        );
```

**Action 4:** Dans la méthode `executeMiner()` (ligne 416-499), après le bloc qui ajoute le minerai au stock, ajouter :

```typescript
        // Log resource gathering
        await dailyEventLogService.logResourceGathered(
          characterId,
          character.name,
          character.townId,
          "Minerai",
          totalQuantity,
          "Miner"
        );
```

**Action 5:** Dans la méthode `executeFish()` (ligne 504-603), après le bloc qui ajoute les vivres au stock, ajouter :

```typescript
        // Log resource gathering
        await dailyEventLogService.logResourceGathered(
          characterId,
          character.name,
          character.townId,
          "Vivres",
          totalQuantity,
          "Pêcher"
        );
```

**Action 6:** Dans la méthode `executeCraft()` (ligne 608-763), après le bloc qui ajoute la ressource craftée au stock (ligne ~728-746), ajouter :

```typescript
        // Log resource gathering (crafting counts as gathering)
        await dailyEventLogService.logResourceGathered(
          characterId,
          character.name,
          character.townId,
          outputResourceType.name,
          outputQuantity,
          capability.name
        );
```

### 3.4 Service Expéditions

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/expedition.service.ts`

**Action 1:** Ajouter l'import en haut du fichier :
```typescript
import { dailyEventLogService } from "./daily-event-log.service";
```

**Action 2:** Dans la méthode `departExpedition()` (ligne 379-414), après le logger.info (ligne ~405-410), ajouter :

```typescript
      // Log expedition departure
      const memberCount = await tx.expeditionMember.count({
        where: { expeditionId },
      });

      await dailyEventLogService.logExpeditionDeparted(
        expeditionId,
        expedition.name,
        expedition.townId,
        memberCount,
        expedition.duration
      );
```

**Action 3:** Dans la méthode `returnExpedition()` (ligne 416-469), avant le logger.info (ligne ~459), ajouter :

```typescript
      // Get expedition resources for logging
      const expeditionResources = await tx.resourceStock.findMany({
        where: {
          locationType: "EXPEDITION",
          locationId: expeditionId,
        },
        include: {
          resourceType: true,
        },
      });

      const resourcesSummary = expeditionResources.map(r => ({
        resourceName: r.resourceType.name,
        quantity: r.quantity,
      }));

      // Log expedition return
      await dailyEventLogService.logExpeditionReturned(
        expeditionId,
        expedition.name,
        expedition.townId,
        resourcesSummary
      );
```

**Action 4:** Dans la méthode `forceEmergencyReturns()` (ligne 581-616), dans la boucle `for`, après le `await this.returnExpedition()` (ligne ~594), ajouter :

```typescript
        // Log emergency return
        const exp = await prisma.expedition.findUnique({
          where: { id: expedition.id },
          select: { townId: true },
        });

        if (exp) {
          await dailyEventLogService.logExpeditionEmergencyReturn(
            expedition.id,
            expedition.name,
            exp.townId
          );
        }
```

## Étape 4: Tests et validation

**Exécuter les commandes suivantes:**

```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend
npm run build
```

Si la compilation réussit, le système de logging est en place !

## Rapport demandé

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/.supernova/report-event-logging.md`

**Contenu:**

```markdown
# Rapport: Système de logging d'événements quotidiens

## Statut
[✅ Terminé / ❌ Erreur / ⚠️ Partiel]

## Modifications effectuées

### Base de données
- [ ] Ajout du modèle DailyEventLog dans schema.prisma
- [ ] Ajout de l'enum DailyEventType
- [ ] Ajout de la relation dans le modèle Town
- [ ] Migration exécutée avec succès
- [ ] Prisma generate exécuté avec succès

### Nouveau service
- [ ] Création du fichier daily-event-log.service.ts
- [ ] Implémentation de toutes les méthodes de logging

### Intégrations
- [ ] Service projets: log des complétions
- [ ] Service chantiers: log des complétions
- [ ] Service capabilities: log de toutes les récoltes (harvest, bûcheron, mineur, pêche, craft)
- [ ] Service expéditions: log des départs
- [ ] Service expéditions: log des retours
- [ ] Service expéditions: log des retours d'urgence

### Tests
- [ ] Compilation backend: [✅ OK / ❌ Erreur]

## Problèmes rencontrés
[Décrire les problèmes rencontrés, s'il y en a]

## Résumé court (< 300 tokens)
[Décris ce qui a été fait, les fichiers modifiés, et si tout fonctionne correctement]
```

## Notes importantes

- Toujours utiliser `await` pour les appels à `dailyEventLogService`
- Les logs doivent être créés dans les transactions existantes si possible
- La date est automatiquement set à "aujourd'hui à 00:00:00" pour faciliter les requêtes
- Ne pas oublier d'exécuter la migration avant de tester
