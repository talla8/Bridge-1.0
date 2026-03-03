import { SubjectId, UploadId, UserId } from './ids';

export enum Status {
  PENDING = 'Pending',
  UPLOADED = 'Uploaded',
  PARSING = 'Parsing',
  PARSED = 'Parsed',
  VALIDATING = 'Validating',
  VALIDATION_FAILED = 'Validation Failed',
  PROCESSING = 'Processing',
  PROCESSED = 'Processed',
  FAILED = 'Failed',
  ARCHIVED = 'Archived',
}

export class Upload {
  uploadId: UploadId;
  teacherId: UserId;
  subjectId: SubjectId;
  filePath: string;
  status: Status;
  createdAt: Date;
}
