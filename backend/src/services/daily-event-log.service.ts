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
