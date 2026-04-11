import {
  CurriculumItemId,
  PlanId,
  PlanItemId,
  PlanLogId,
  SessionId,
} from './ids';

export enum PlanLogActionType {
  PLAN_GENERATED = 'PLAN_GENERATED',
  ITEM_COMPLETED = 'ITEM_COMPLETED',
  ITEM_POSTPONED = 'ITEM_POSTPONED',
  ITEM_CANCELLED = 'ITEM_CANCELLED',
  ITEM_TIME_UPDATED = 'ITEM_TIME_UPDATED',
  ITEM_REINSERTED = 'ITEM_REINSERTED',
  PLAN_REGENERATED = 'PLAN_REGENERATED',
}

export class PlanLog {
  planLogId: PlanLogId;
  planId: PlanId;
  sessionId?: SessionId;
  planItemId?: PlanItemId;
  curriculumItemId?: CurriculumItemId;
  actionType: PlanLogActionType;
  description: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
