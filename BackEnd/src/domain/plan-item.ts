import {
  CurriculumItemId,
  PlanId,
  PlanItemId,
  SessionId,
  SubjectId,
} from './ids';

export enum PlanItemStatus {
  PLANNED = 'Planned',
  COMPLETED = 'Completed',
  POSTPONED = 'Postponed',
  CANCELLED = 'Cancelled',
}

export class PlanItem {
  planItemId: PlanItemId;
  planId: PlanId;
  sessionId: SessionId;
  curriculumItemId: CurriculumItemId;
  subjectId: SubjectId;
  title: string;
  estimatedTime: number;
  status: PlanItemStatus;
  notes?: string;
}
