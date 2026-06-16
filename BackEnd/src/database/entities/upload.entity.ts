import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Upload, Status } from 'src/domain/upload';

@Entity({ name: 'uploads' })
export class UploadEntity implements Upload {
  @PrimaryColumn({ name: 'upload_id', type: 'text' })
  uploadId: string;

  @Column({ name: 'teacher_id', type: 'text' })
  teacherId: string;

  @Column({ name: 'subject_id', type: 'text' })
  subjectId: string;

  @Column({ name: 'file_path', type: 'text' })
  filePath: string;

  @Column({ type: 'text' })
  status: Status;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
