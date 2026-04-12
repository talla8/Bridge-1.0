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
  unitNo: number;
  lessonNo: number;
  orderInLesson: number;
  estimatedTime: number;
  status: PlanItemStatus;
  originalSessionId?: string;
  originalSessionOrder?: number;
  carriedForwardCount?: number;
  notes?: string;
}
