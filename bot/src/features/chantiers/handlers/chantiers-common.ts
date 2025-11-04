/**
 * Types et interfaces communes pour le module chantiers
 */

export interface Town {
  id: string;
  name: string;
  foodStock: number;
}

export interface ActiveCharacter {
  id: string;
  paTotal: number;
  name: string;
}

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

export interface Chantier {
  id: string;
  name: string;
  cost: number;
  spendOnIt: number;
  status: "PLAN" | "IN_PROGRESS" | "COMPLETED";
  townId: string;
  createdBy: string;
  completionText?: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resourceCosts?: ResourceCost[];
}

export interface InvestResult {
  success: boolean;
  chantier: Chantier;
  pointsInvested: number;
  remainingPoints: number;
  isCompleted: boolean;
}
