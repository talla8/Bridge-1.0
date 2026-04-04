import { CurriculumItemId, GradeId, SubjectId } from './ids';

export class CurriculumItem {
  unitNo: number;
  lessonNo: number;
  orderInLesson: number;
  curriculumItemId: CurriculumItemId;
  semester: any;
  name: string;
  gradeId: GradeId;
  subjectId: SubjectId;
  skillsSupported: string[];
  estimatedTime: any;
  difficulity: number;
}
