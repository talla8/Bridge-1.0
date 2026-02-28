import { UploadRepository } from 'src/repositories/upload.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryUploadsRepo implements UploadRepository {
  private uploads: any[] = [];

  async create(upload: any): Promise<any> {
    this.uploads.push(upload);
    return upload;
  }

  async findById(id: string): Promise<any | null> {
    return this.uploads.find(function (upload: any): boolean {
      return upload.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.uploads;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.uploads.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.uploads[index];
    const updated = { ...current, ...patch };
    this.uploads[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.uploads.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.uploads.splice(index, 1);
    return true;
  }
}
