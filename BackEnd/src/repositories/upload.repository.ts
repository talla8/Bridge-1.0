import { Upload } from 'src/domain/upload';

export interface UploadRepository {
  create(upload: Upload): Promise<Upload>;
  findById(id: string): Promise<Upload | null>;
  findAll(): Promise<Upload[]>;
  update(id: string, patch: Partial<Upload>): Promise<Upload | null>;
  delete(id: string): Promise<boolean>;
}
