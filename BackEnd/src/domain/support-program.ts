import {
  GradeId,
  SkillId,
  SubjectId,
  SupportItemId,
  SupportProgramId,
  SupportProgramMilestoneId,
} from './ids';

export class SupportProgramItem {
  supportItemId: SupportItemId;
  orderInMilestone: number;
  name: string;
  type: string;
  skillsSupported: SkillId[];
  estimatedTime: number;
  difficulty: number;
}

export class SupportProgramMilestone {
  milestoneId: SupportProgramMilestoneId;
  milestoneNo: number;
  name: string;
  goal: string;
  requiredExerciseCount?: number;
  requiredQuizScore?: number;
  requiredQuizCount?: number;
  requiredAverageScore?: number;
  items: SupportProgramItem[];
}

export class SupportProgram {
  supportProgramId: SupportProgramId;
  programName: string;
  gradeId: GradeId;
  subjectId: SubjectId;
  targetSkill: SkillId;
  sourceUnitNo: number;
  sourceLessonNo: number;
  milestones: SupportProgramMilestone[];
}
