# PROMPT SUPERNOVA - Messages Quotidiens 8h

## CONTEXTE
Projet FateWeaverBot - Discord RPG bot (TypeScript) avec backend Express/Prisma + PostgreSQL.
Working directory: `/home/bouloc/Repo/FateWeaverBot/backend/`

## OBJECTIF
Implémenter le système de messages quotidiens automatiques envoyés à 8h dans chaque ville Discord, contenant météo + récapitulatif des événements de la veille.

## ARCHITECTURE

### 1. BASE DE DONNÉES (schema.prisma)

**Nouveaux modèles à créer :**

```prisma
enum WeatherMessageType {
  NORMAL_SUMMER
  NORMAL_WINTER
  FIRST_DAY_SUMMER
  FIRST_DAY_WINTER
}

model WeatherMessage {
  id        String              @id @default(cuid())
  type      WeatherMessageType
  message   String              // Texte du message météo
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt @map("updated_at")

  @@map("weather_messages")
}

model WeatherMessageUsage {
  id               String   @id @default(cuid())
  weatherMessageId String   @map("weather_message_id")
  seasonStartDate  DateTime @map("season_start_date") // Date de début de la saison actuelle
  usedAt           DateTime @default(now()) @map("used_at")

  weatherMessage WeatherMessage @relation(fields: [weatherMessageId], references: [id], onDelete: Cascade)

  @@index([seasonStartDate, weatherMessageId])
  @@map("weather_message_usage")
}

model DailyMessageOverride {
  id        String   @id @default(cuid())
  townId    String   @map("town_id")
  date      DateTime // Date pour laquelle l'override s'applique (minuit)
  message   String   // Message météo custom
  createdBy String   @map("created_by") // Discord user ID de l'admin
  createdAt DateTime @default(now()) @map("created_at")

  town Town @relation(fields: [townId], references: [id], onDelete: Cascade)

  @@unique([townId, date])
  @@map("daily_message_overrides")
}
```

**Ajouter relations dans Town :**
```prisma
model Town {
  // ... champs existants
  dailyMessageOverrides DailyMessageOverride[]
}
```

**Créer migration :** `npx prisma migrate dev --name add_daily_messages_system`

### 2. SERVICE (daily-message.service.ts)

Créer `/home/bouloc/Repo/FateWeaverBot/backend/src/services/daily-message.service.ts`

**Structure du service :**

```typescript
import { PrismaClient, WeatherMessageType, SeasonType } from "@prisma/client";
import { dailyEventLogService } from "./daily-event-log.service";

const prisma = new PrismaClient();

export class DailyMessageService {

  /**
   * Récupère le message météo pour aujourd'hui
   * Vérifie d'abord s'il y a un override admin
   * Sinon, choisit un message aléatoire selon la saison/type
   */
  async getWeatherMessage(townId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check for admin override
    const override = await prisma.dailyMessageOverride.findUnique({
      where: {
        townId_date: { townId, date: today }
      }
    });

    if (override) {
      return override.message;
    }

    // 2. Get current season
    const season = await prisma.season.findUnique({ where: { id: 1 } });
    if (!season) throw new Error("Season not found");

    // 3. Determine message type
    const messageType = await this.determineWeatherMessageType(season.name, today);

    // 4. Get unused messages for this season
    const seasonStart = await this.getSeasonStartDate(season.name, today);
    const usedMessageIds = await prisma.weatherMessageUsage.findMany({
      where: {
        seasonStartDate: seasonStart
      },
      select: { weatherMessageId: true }
    });

    const usedIds = usedMessageIds.map(u => u.weatherMessageId);

    // 5. Pick random unused message
    const availableMessages = await prisma.weatherMessage.findMany({
      where: {
        type: messageType,
        id: { notIn: usedIds }
      }
    });

    // If all messages used, reset and start over
    if (availableMessages.length === 0) {
      await prisma.weatherMessageUsage.deleteMany({
        where: { seasonStartDate: seasonStart }
      });

      const allMessages = await prisma.weatherMessage.findMany({
        where: { type: messageType }
      });

      availableMessages.push(...allMessages);
    }

    const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];

    // 6. Mark as used
    await prisma.weatherMessageUsage.create({
      data: {
        weatherMessageId: selectedMessage.id,
        seasonStartDate: seasonStart
      }
    });

    return selectedMessage.message;
  }

  /**
   * Détermine le type de message selon la saison et si c'est le premier jour
   */
  private async determineWeatherMessageType(
    season: SeasonType,
    date: Date
  ): Promise<WeatherMessageType> {
    // Check if it's the first day of the season
    const seasonStart = await this.getSeasonStartDate(season, date);
    const isFirstDay = date.getTime() === seasonStart.getTime();

    if (isFirstDay) {
      return season === "SUMMER" ? "FIRST_DAY_SUMMER" : "FIRST_DAY_WINTER";
    }

    return season === "SUMMER" ? "NORMAL_SUMMER" : "NORMAL_WINTER";
  }

  /**
   * Calcule la date de début de la saison actuelle
   */
  private async getSeasonStartDate(season: SeasonType, currentDate: Date): Promise<Date> {
    // Logic to determine season start based on game rules
    // For now, assume seasons last 30 days and alternate
    // TODO: Implement proper season tracking
    const seasonRecord = await prisma.season.findUnique({ where: { id: 1 } });
    if (!seasonRecord) throw new Error("Season not found");

    return seasonRecord.updatedAt; // Simplified - use last season change date
  }

  /**
   * Récupère le récapitulatif des actions de la veille
   */
  async getActionRecap(townId: string): Promise<string> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const events = await dailyEventLogService.getEventsByDateAndTown(yesterday, townId);

    if (events.length === 0) {
      return "Aucune activité notable hier.";
    }

    const lines: string[] = [];

    for (const event of events) {
      lines.push(`- ${event.description}`);
    }

    return lines.join("\n");
  }

  /**
   * Récupère le résumé des stocks actuels de la ville
   */
  async getStockSummary(townId: string): Promise<string> {
    const stocks = await prisma.resourceStock.findMany({
      where: {
        locationType: "CITY",
        locationId: townId,
        quantity: { gt: 0 }
      },
      include: {
        resourceType: true
      },
      orderBy: {
        resourceType: { name: "asc" }
      }
    });

    if (stocks.length === 0) {
      return "Aucune ressource en stock.";
    }

    const lines = stocks.map(s => `- ${s.resourceType.emoji} ${s.resourceType.name}: ${s.quantity}`);
    return lines.join("\n");
  }

  /**
   * Récupère le bilan des expéditions (départs, retours, etc.)
   */
  async getExpeditionSummary(townId: string): Promise<string> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const events = await dailyEventLogService.getEventsByDateAndTown(yesterday, townId);

    const expeditionEvents = events.filter(e =>
      e.eventType.includes("EXPEDITION") || e.eventType.includes("CHARACTER_CATASTROPHIC_RETURN")
    );

    if (expeditionEvents.length === 0) {
      return "Aucun mouvement d'expédition hier.";
    }

    const lines = expeditionEvents.map(e => `- ${e.description}`);
    return lines.join("\n");
  }

  /**
   * Construit le message quotidien complet
   */
  async buildDailyMessage(townId: string): Promise<string> {
    const [weather, actions, stocks, expeditions] = await Promise.all([
      this.getWeatherMessage(townId),
      this.getActionRecap(townId),
      this.getStockSummary(townId),
      this.getExpeditionSummary(townId)
    ]);

    const message = `
# 🌅 Bulletin quotidien

## 🌤️ Météo
${weather}

## 📜 Activités d'hier
${actions}

## 📦 Stocks actuels
${stocks}

## 🏕️ Expéditions
${expeditions}
    `.trim();

    return message;
  }
}

export const dailyMessageService = new DailyMessageService();
```

### 3. CRON JOB (daily-message.cron.ts)

Créer `/home/bouloc/Repo/FateWeaverBot/backend/src/cron/daily-message.cron.ts`

```typescript
import { CronJob } from "cron";
import { PrismaClient } from "@prisma/client";
import { dailyMessageService } from "../services/daily-message.service";
import { logger } from "../services/logger";

const prisma = new PrismaClient();

async function sendDailyMessages() {
  try {
    logger.info("Starting daily message broadcast at 08:00");

    const towns = await prisma.town.findMany({
      include: {
        guild: {
          select: { logChannelId: true }
        }
      }
    });

    let sentCount = 0;

    for (const town of towns) {
      try {
        if (!town.guild?.logChannelId) {
          logger.warn(`Town ${town.name} has no log channel configured, skipping`);
          continue;
        }

        const message = await dailyMessageService.buildDailyMessage(town.id);

        // TODO: Implement Discord webhook or API call to send message
        // For now, just log it
        logger.info(`Daily message for ${town.name}:`, { message });

        // In production, this would send to Discord:
        // await discordClient.channels.cache.get(town.guild.logChannelId)?.send(message);

        sentCount++;
      } catch (error) {
        logger.error(`Failed to send daily message for town ${town.name}:`, { error });
      }
    }

    logger.info(`Daily messages sent to ${sentCount} towns`);
  } catch (error) {
    logger.error("Error in sendDailyMessages cron job:", { error });
  }
}

export function setupDailyMessageJob() {
  const job = new CronJob(
    "0 8 * * *", // 08:00:00 every day
    sendDailyMessages,
    null,
    true,
    "Europe/Paris"
  );

  logger.info("Daily message job scheduled for 08:00 daily");

  return { dailyMessageJob: job };
}
```

### 4. ENREGISTREMENT DU CRON (app.ts)

Ajouter dans `/home/bouloc/Repo/FateWeaverBot/backend/src/app.ts` :

```typescript
import { setupDailyMessageJob } from "./cron/daily-message.cron";

// ... dans la fonction de démarrage
setupDailyMessageJob();
```

## VALIDATION

1. **Compilation :** `npm run build` doit passer sans erreur
2. **Migration :** Vérifier que la migration s'applique correctement
3. **Test du service :** Créer quelques messages météo en base et tester `buildDailyMessage()`

## LIVRABLES

1. Nouveau schema avec 3 modèles + migration appliquée
2. Service `daily-message.service.ts` complet et fonctionnel
3. Cron job `daily-message.cron.ts` configuré
4. Enregistrement dans `app.ts`
5. Code compilé sans erreur

## NOTES IMPORTANTES

- Le système de logging `dailyEventLogService` existe déjà et est fonctionnel
- Utiliser `logger` pour tous les logs (pas console.log)
- Timezone : "Europe/Paris"
- Les messages Discord seront intégrés plus tard par le bot, focus sur la génération des messages

## RAPPORT ATTENDU

Créer un rapport dans `.supernova/report-daily-messages.md` avec :
- Résumé <300 tokens des changements
- Liste des fichiers créés/modifiés
- Statut de la compilation
- Points d'attention pour l'intégration Discord future
