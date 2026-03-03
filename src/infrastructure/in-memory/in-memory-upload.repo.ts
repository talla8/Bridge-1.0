import { Injectable } from '@nestjs/common';
import { Upload } from 'src/domain/upload';
import { UploadRepository } from 'src/repositories/upload.repository';

@Injectable()
export class InMemoryUploadsRepo implements UploadRepository {
  private uploads: Upload[] = [];

  async create(upload: Upload): Promise<Upload> {
    this.uploads.push(upload);
    return upload;
  }

  async findById(id: string): Promise<Upload | null> {
    return this.uploads.find((upload: Upload): boolean => upload.uploadId === id) ?? null;
  }

  async findAll(): Promise<Upload[]> {
    return this.uploads;
  }

  async update(id: string, patch: Partial<Upload>): Promise<Upload | null> {
    const index = this.uploads.findIndex((item: Upload): boolean => item.uploadId === id);
    if (index === -1) return null;

    const updated: Upload = { ...this.uploads[index], ...patch };
    this.uploads[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.uploads.findIndex((item: Upload): boolean => item.uploadId === id);
    if (index === -1) return false;

    this.uploads.splice(index, 1);
    return true;
  }
}
