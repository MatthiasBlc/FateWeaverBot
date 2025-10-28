import { PrismaClient, WeatherMessageType, SeasonType } from "@prisma/client";
import { dailyEventLogService } from "./daily-event-log.service";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';

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
    const override = await (prisma as any).dailyMessageOverride.findUnique({
      where: {
        townId_date: { townId, date: today }
      }
    });

    if (override) {
      return override.message;
    }

    // 2. Get current season
    const season = await prisma.season.findUnique({ where: { id: 1 } });
    if (!season) throw new NotFoundError("Season", 1);

    // 3. Determine message type
    const messageType = await this.determineWeatherMessageType(season.name, today);

    // 4. Get unused messages for this season
    const seasonStart = await this.getSeasonStartDate(season.name, today);
    const usedMessageIds = await (prisma as any).weatherMessageUsage.findMany({
      where: {
        seasonStartDate: seasonStart
      },
      select: { weatherMessageId: true }
    });

    const usedIds = usedMessageIds.map((u: any) => u.weatherMessageId);

    // 5. Pick random unused message
    const availableMessages = await (prisma as any).weatherMessage.findMany({
      where: {
        type: messageType,
        id: { notIn: usedIds }
      }
    });

    // If all messages used, reset and start over
    if (availableMessages.length === 0) {
      await (prisma as any).weatherMessageUsage.deleteMany({
        where: { seasonStartDate: seasonStart }
      });

      const allMessages = await (prisma as any).weatherMessage.findMany({
        where: { type: messageType }
      });

      availableMessages.push(...allMessages);
    }

    // Check if we have messages available
    if (availableMessages.length === 0) {
      return `Aucun message météo disponible pour ${messageType}.`;
    }

    const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];

    // 6. Mark as used
    await (prisma as any).weatherMessageUsage.create({
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
    if (!seasonRecord) throw new NotFoundError('Season', 1);

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
