import { GradeId, SchoolId, SkillId, SubjectId } from './ids';

export class Exercise {
  skillId: SkillId[];
  subjectId: SubjectId;
  gradeId: GradeId;
  code: string; //unioin
  title: string;
}
