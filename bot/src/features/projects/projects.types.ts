export interface ResourceCost {
  id: string;
  resourceTypeId: number;
  quantityRequired: number;
  quantityContributed: number;
  resourceType: {
    id: number;
    name: string;
    emoji: string;
  };
}

import { type CraftEnum } from "./projects.utils";

export interface Project {
  id: string;
  name: string;
  paRequired: number;
  paContributed: number;
  status: "ACTIVE" | "COMPLETED";
  townId: string;
  createdBy: string;
  craftTypes: CraftEnum[];
  outputResourceTypeId: number | null;
  outputObjectTypeId: number | null;
  outputQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  resourceCosts?: ResourceCost[];
  outputResourceType?: {
    id: number;
    name: string;
    emoji: string;
  };
  outputObjectType?: {
    id: number;
    name: string;
  };
  // Blueprint fields
  isBlueprint?: boolean;
  originalProjectId?: number;
  paBlueprintRequired?: number;
  blueprintResourceCosts?: ResourceCost[];
}

export interface CreateProjectData {
  name: string;
  paRequired: number;
  townId: string;
  craftTypes: CraftEnum[];
  outputResourceTypeId?: number;
  outputObjectTypeId?: number;
  outputQuantity: number;
  resourceCosts?: { resourceTypeId: number; quantityRequired: number }[];
  // Blueprint fields
  paBlueprintRequired?: number;
  blueprintResourceCosts?: { resourceTypeId: number; quantityRequired: number }[];
}

export interface InvestResult {
  pointsInvested: number;
  remainingPoints: number;
  isCompleted: boolean;
}

export type ProjectReward =
  | { type: "RESOURCE"; resourceTypeId: number; quantity: number }
  | { type: "RESOURCE_CONVERSION"; resources: { resourceTypeId: number; quantity: number; resourceName: string }[] }
  | { type: "OBJECT"; objectType: { id: number; name: string }; slotId: string };

export interface ContributionResult {
  project: Project;
  completed: boolean;
  reward?: ProjectReward;
}

export interface CapabilitySummary {
  id: string;
  name: string;
  emojiTag: string;
  category: string;
  costPA: number;
  description?: string;
}
