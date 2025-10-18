// Export des services API organisés
export { BaseAPIService } from './base-api.service';
export { CharacterAPIService } from './character-api.service';
export { GuildAPIService } from './guild-api.service';
export { ChantierAPIService } from './chantier-api.service';
export { ProjectAPIService } from './project-api.service';
export { CapabilityAPIService } from './capability-api.service';
export { ResourceAPIService } from './resource-api.service';
export { SkillAPIService } from './skill-api.service';
export { JobAPIService } from './job-api.service';
export type { JobDto, CreateJobDto } from './job-api.service';

// Export de l'instance API principale
export { apiService } from '../api';
