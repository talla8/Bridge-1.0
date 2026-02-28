import { ExerciseId, GradeId, SchoolId, SkillId, StudentId, SubjectId, UploadId, UserId } from './ids';

export class Exercise {
  uploadId: UploadId;
  teacherId: UserId;
  subjectId: SubjectId;
  filePath: string;
  status: string; //un ion tyoe
  createdAt: Date;
}
