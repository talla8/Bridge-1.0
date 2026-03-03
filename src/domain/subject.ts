import { SubjectId } from './ids';

export enum SubjectName {
  MATH = 'Math',
  ARABIC = 'Arabic',
}

export class Subject {
  subjectId: SubjectId;
  subjectName: string; //union
  schoolYear: string;
}
