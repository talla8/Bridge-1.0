import { CurriculumItemId, PlanId, PlanItemId, SessionId } from './ids';

export enum Status {
  NOTSTARTED = 'Not Started',
  INPROGRESS = 'In Progress',
  DONE = 'Done',
  CANCLED = 'Canceled',
  POSTPONED = `Postponed`,
}

export enum PlanLogActivityType {
  TIME_EDITED = 'Time Edited',
  STATUS_CHANGED = 'Status Changed',
  COMPLETED = 'Completed',
  POSTPONED = 'Postponed',
  CANCELLED = 'Cancelled',
}

export class PlanLog {
  planId: PlanId;
  sessionId: SessionId;
  planItemId: PlanItemId;
  activityType: PlanLogActivityType;
  date: Date;
  status: Status;
  postponedTo?: Date;
  curriculumItemId: CurriculumItemId;
}
