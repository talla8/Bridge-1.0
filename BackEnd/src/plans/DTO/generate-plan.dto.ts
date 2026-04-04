import { SubjectId } from 'src/domain/ids';

export class GeneratePlanDTO {
  subjectId: SubjectId;
  semester: 1 | 2;
}
