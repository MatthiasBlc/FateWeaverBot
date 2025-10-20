import { PrismaClient, Season as PrismaSeason, SeasonType } from '@prisma/client';
import { logger } from './logger';

export class SeasonService {
  private currentSeason: PrismaSeason | null = null;
  private lastUpdate: Date | null = null;
  private readonly SEASON_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 semaine en millisecondes

  constructor(private prisma: PrismaClient) {}

  /**
   * Initialise le service des saisons
   */
  async initialize(): Promise<void> {
    try {
      // Vérifier s'il existe déjà une saison
      let season = await this.prisma.season.findUnique({
        where: { id: 1 }
      });

      // Si aucune saison n'existe, en créer une par défaut (Été)
      if (!season) {
        season = await this.prisma.season.create({
          data: {
            id: 1,
            name: SeasonType.SUMMER
          }
        });
        logger.info('Saison par défaut créée :', season.name);
      }

      this.currentSeason = season;
      this.lastUpdate = season.updatedAt;
      logger.info(`Saison actuelle : ${this.currentSeason.name}`);
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service des saisons :', error);
      throw error;
    }
  }

  /**
   * Récupère la saison actuelle
   */
  async getCurrentSeason(): Promise<PrismaSeason> {
    if (!this.currentSeason) {
      await this.initialize();
    }
    return this.currentSeason!;
  }

  /**
   * Vérifie et met à jour la saison si nécessaire
   * Cette méthode est appelée tous les lundis à minuit par le CRON
   * Elle alterne TOUJOURS la saison, indépendamment des changements manuels
   */
  async checkAndUpdateSeason(): Promise<{ changed: boolean; newSeason?: PrismaSeason }> {
    if (!this.currentSeason) {
      await this.initialize();
    }

    logger.info('Changement automatique de saison (lundi minuit)');
    return this.toggleSeason();
  }

  /**
   * Bascule la saison actuelle
   */
  async toggleSeason(): Promise<{ changed: boolean; newSeason: PrismaSeason }> {
    try {
      const currentSeason = await this.getCurrentSeason();
      const newSeasonType = currentSeason.name === SeasonType.SUMMER 
        ? SeasonType.WINTER 
        : SeasonType.SUMMER;

      const updatedSeason = await this.prisma.season.update({
        where: { id: 1 },
        data: {
          name: newSeasonType,
          updatedAt: new Date()
        }
      });

      this.currentSeason = updatedSeason;
      this.lastUpdate = updatedSeason.updatedAt;

      logger.info(`Nouvelle saison : ${updatedSeason.name}`);
      return { changed: true, newSeason: updatedSeason };
    } catch (error) {
      logger.error('Erreur lors du changement de saison :', error);
      throw error;
    }
  }

  /**
   * Force le changement de saison
   */
  async forceSeasonChange(seasonType: SeasonType): Promise<PrismaSeason> {
    try {
      const updatedSeason = await this.prisma.season.update({
        where: { id: 1 },
        data: {
          name: seasonType,
          updatedAt: new Date()
        }
      });

      this.currentSeason = updatedSeason;
      this.lastUpdate = updatedSeason.updatedAt;

      logger.info(`Saison forcée : ${updatedSeason.name}`);
      return updatedSeason;
    } catch (error) {
      logger.error('Erreur lors du forçage du changement de saison :', error);
      throw error;
    }
  }

  /**
   * Vérifie si c'est l'été
   */
  async isSummer(): Promise<boolean> {
    const season = await this.getCurrentSeason();
    return season.name === SeasonType.SUMMER;
  }

  /**
   * Vérifie si c'est l'hiver
   */
  async isWinter(): Promise<boolean> {
    return !(await this.isSummer());
  }

  /**
   * Récupère la date du prochain changement de saison
   */
  getNextSeasonChangeDate(): Date {
    if (!this.lastUpdate) {
      throw new Error('Service des saisons non initialisé');
    }

    const nextChange = new Date(this.lastUpdate);
    nextChange.setDate(nextChange.getDate() + 7); // Prochain changement dans 7 jours
    return nextChange;
  }

  /**
   * Formate la date du prochain changement de saison
   */
  formatNextSeasonChange(): string {
    try {
      const nextChange = this.getNextSeasonChangeDate();
      return `Prochain changement de saison : <t:${Math.floor(nextChange.getTime() / 1000)}:R>`;
    } catch (error) {
      return 'Impossible de déterminer la date du prochain changement de saison';
    }
  }

  /**
   * Récupère le temps restant avant le prochain changement de saison
   */
  getTimeUntilNextSeason(): string {
    try {
      const nextChange = this.getNextSeasonChangeDate();
      const now = new Date();
      const diff = nextChange.getTime() - now.getTime();
      
      if (diff <= 0) {
        return 'Changement de saison imminent !';
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `Changement dans ${days}j ${hours}h ${minutes}m`;
    } catch (error) {
      return 'Impossible de déterminer le temps restant';
    }
  }
}
