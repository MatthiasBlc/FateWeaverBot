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

export interface Project {
  id: string;
  name: string;
  paRequired: number;
  paContributed: number;
  status: "ACTIVE" | "COMPLETED";
  townId: string;
  createdBy: string;
  craftTypes: ('TISSER' | 'FORGER' | 'TRAVAILLER_LE_BOIS')[];
  outputResourceTypeId: number;
  outputQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  resourceCosts?: ResourceCost[];
  outputResourceType?: {
    id: number;
    name: string;
    emoji: string;
  };
}

export interface CreateProjectData {
  name: string;
  paRequired: number;
  townId: string;
  craftTypes: string[];
  outputResourceTypeId: number;
  outputQuantity: number;
  resourceCosts?: { resourceTypeId: number; quantityRequired: number }[];
}

export interface InvestResult {
  pointsInvested: number;
  remainingPoints: number;
  isCompleted: boolean;
}
