import { GradeId, SkillId, SubjectId } from './ids';

export class Skill {
  skillId: SkillId;
  subjectId: SubjectId;
  gradeId: GradeId;
  code: string; //unioin
  title: string;
}
