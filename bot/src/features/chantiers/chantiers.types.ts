export interface Chantier {
  id: string;
  name: string;
  cost: number;
  spendOnIt: number;
  status: "PLAN" | "IN_PROGRESS" | "COMPLETED";
  serverId: string;
  createdBy: string;
  startDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChantierData {
  name: string;
  cost: number;
  serverId: string;
}

export interface InvestResult {
  pointsInvested: number;
  remainingPoints: number;
  isCompleted: boolean;
}
