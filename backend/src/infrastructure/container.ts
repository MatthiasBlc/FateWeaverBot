import { PrismaClient } from "@prisma/client";

// Import all repositories
import { CapabilityRepository } from "../domain/repositories/capability.repository";
import { ChantierRepository } from "../domain/repositories/chantier.repository";
import { CharacterRepository } from "../domain/repositories/character.repository";
import { ExpeditionRepository } from "../domain/repositories/expedition.repository";
import { GuildRepository } from "../domain/repositories/guild.repository";
import { JobRepository } from "../domain/repositories/job.repository";
import { ObjectRepository } from "../domain/repositories/object.repository";
import { ProjectRepository } from "../domain/repositories/project.repository";
import { ResourceRepository } from "../domain/repositories/resource.repository";
import { RoleRepository } from "../domain/repositories/role.repository";
import { SeasonRepository } from "../domain/repositories/season.repository";
import { SkillRepository } from "../domain/repositories/skill.repository";
import { TownRepository } from "../domain/repositories/town.repository";
import { UserRepository } from "../domain/repositories/user.repository";

// Import all services
import { actionPointService } from "../services/action-point.service";
import { CapabilityService } from "../services/capability.service";
import { ChantierService } from "../services/chantier.service";
import { DailyEventLogService } from "../services/daily-event-log.service";
import { DailyMessageService } from "../services/daily-message.service";
import { discordNotificationService } from "../services/discord-notification.service";
import { ExpeditionService } from "../services/expedition.service";
import { JobService } from "../services/job.service";
import { objectService } from "../services/object.service";
import { ProjectService } from "../services/project.service";
import { ResourceService } from "../services/resource.service";
import { SeasonService } from "../services/season.service";
import { CharacterService } from "../services/character/character.service";
import { CharacterStatsService } from "../services/character/character-stats.service";
import { CharacterInventoryService } from "../services/character/character-inventory.service";
import { CharacterCapabilityService } from "../services/character/character-capability.service";

// Import Discord Client
import { Client, GatewayIntentBits } from 'discord.js';

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;

  // Discord Client for DiscordNotificationService
  private discordClient: Client;

  // Repositories (14)
  public capabilityRepo: CapabilityRepository;
  public chantierRepo: ChantierRepository;
  public characterRepo: CharacterRepository;
  public expeditionRepo: ExpeditionRepository;
  public guildRepo: GuildRepository;
  public jobRepo: JobRepository;
  public objectRepo: ObjectRepository;
  public projectRepo: ProjectRepository;
  public resourceRepo: ResourceRepository;
  public roleRepo: RoleRepository;
  public seasonRepo: SeasonRepository;
  public skillRepo: SkillRepository;
  public townRepo: TownRepository;
  public userRepo: UserRepository;

  // Services (18) - using singleton instances where available, classes where needed
  public actionPointService: any;
  public capabilityService: CapabilityService;
  public chantierService: ChantierService;
  public dailyEventLogService: DailyEventLogService;
  public dailyMessageService: DailyMessageService;
  public discordNotificationService: any;
  public expeditionService: ExpeditionService;
  public jobService: any;
  public objectService: any;
  public projectService: any;
  public resourceService: ResourceService;
  public seasonService: SeasonService;
  public characterService: CharacterService;
  public characterStatsService: any;
  public characterInventoryService: any;
  public characterCapabilityService: CharacterCapabilityService;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient();

    // Initialize Discord Client
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    // Initialize all repositories (they only need PrismaClient)
    this.capabilityRepo = new CapabilityRepository(this.prisma);
    this.chantierRepo = new ChantierRepository(this.prisma);
    this.characterRepo = new CharacterRepository(this.prisma);
    this.expeditionRepo = new ExpeditionRepository(this.prisma);
    this.guildRepo = new GuildRepository(this.prisma);
    this.jobRepo = new JobRepository(this.prisma);
    this.objectRepo = new ObjectRepository(this.prisma);
    this.projectRepo = new ProjectRepository(this.prisma);
    this.resourceRepo = new ResourceRepository(this.prisma);
    this.roleRepo = new RoleRepository(this.prisma);
    this.seasonRepo = new SeasonRepository(this.prisma);
    this.skillRepo = new SkillRepository(this.prisma);
    this.townRepo = new TownRepository(this.prisma);
    this.userRepo = new UserRepository(this.prisma);

    // Initialize all services (with proper dependencies)
    // Services that only need repositories
    this.resourceService = new ResourceService(this.prisma, this.resourceRepo);
    this.seasonService = new SeasonService(this.prisma, this.seasonRepo);
    this.chantierService = new ChantierService(this.chantierRepo);
    this.projectService = ProjectService;

    // Services that need repositories and other services
    this.capabilityService = new CapabilityService(this.prisma, this.capabilityRepo);
    this.expeditionService = new ExpeditionService(this.expeditionRepo, this.resourceRepo);

    // Character services (with dependencies)
    this.characterService = new CharacterService(this.characterRepo);
    this.characterStatsService = new CharacterStatsService();
    this.characterInventoryService = new CharacterInventoryService();
    this.characterCapabilityService = new CharacterCapabilityService(this.capabilityService, this.characterRepo);

    // Services that don't need dependencies or use other services
    this.dailyEventLogService = new DailyEventLogService();
    this.dailyMessageService = new DailyMessageService();

    // Use singleton instances for services that don't export classes
    this.actionPointService = actionPointService;
    this.discordNotificationService = discordNotificationService;
    this.objectService = objectService;
    this.jobService = JobService;
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  async disconnect() {
    await this.prisma.$disconnect();
    await this.discordClient.destroy();
  }
}

// Export singleton instance
export const container = Container.getInstance();
