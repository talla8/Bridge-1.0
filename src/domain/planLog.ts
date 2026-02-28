import { ExerciseId, PlanId, SessionId, SkillId } from './ids';

export class Exercise {
  planId: PlanId;
  sessionId: SessionId;
  skillId: SkillId;
  activityType: string; //union
  date: Date;
  status: string; //union
  exerciseId: ExerciseId;
}
