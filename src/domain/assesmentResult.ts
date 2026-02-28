import { ResultId, SkillId, StudentId, UploadId } from "./ids";

export class AssesmentResult {
  resultId: ResultId;
  uploadId: UploadId;
  studentId: StudentId;
  skillId : SkillId;
  totalScore: number;
  level: string;
}