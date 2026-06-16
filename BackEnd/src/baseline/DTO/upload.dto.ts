import { SubjectId, UserId } from 'src/domain/ids';
import { Status } from 'src/domain/upload';

export class UploadDTO {
  teacherId: UserId;
  subjectId: SubjectId;
  filePath: string;
  status?: Status;
  createdAt?: Date;
}
