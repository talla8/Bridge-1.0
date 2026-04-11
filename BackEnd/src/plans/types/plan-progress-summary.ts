export type PlanProgressSummary = {
  planId: string;
  totalItems: number;
  completedItems: number;
  remainingItems: number;
  cancelledItems: number;
  progressPercentage: number;
};
