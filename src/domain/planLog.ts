import { ExerciseId, PlanId, SessionId, SkillId } from './ids';

export enum Status {
  NOTSTARTED = 'Not Started',
  INPROGRESS = 'In Progress',
  DONE = 'Done',
  CANCLED = 'Canceled',
  POSTPONED = `Postponed`,
}
export class PlanLog {
  planId: PlanId;
  sessionId: SessionId;
  skillId: SkillId;
  activityType: string; //union (later)
  date: Date;
  status: Status;
  postponedTo?: Date;
  exerciseId: ExerciseId;
}
