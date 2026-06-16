import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from 'src/domain/upload';
import { UploadRepository } from 'src/repositories/upload.repository';
import { UploadEntity } from './entities/upload.entity';

@Injectable()
export class SqliteUploadsRepo implements UploadRepository {
  constructor(
    @InjectRepository(UploadEntity)
    private readonly repository: Repository<UploadEntity>,
  ) {}

  async create(upload: Upload): Promise<Upload> {
    const entity = this.repository.create(this.normalizeUpload(upload));
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<Upload | null> {
    return this.repository.findOneBy({ uploadId: String(id) });
  }

  async findAll(): Promise<Upload[]> {
    return this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async update(id: string, patch: Partial<Upload>): Promise<Upload | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const normalizedPatch = this.normalizeUploadPatch(patch);
    const merged = this.repository.merge(
      this.repository.create(existing),
      normalizedPatch as Partial<UploadEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ uploadId: String(id) });
    return true;
  }

  private normalizeUpload(upload: Upload): Upload {
    return {
      ...upload,
      uploadId: String(upload.uploadId),
      teacherId: String(upload.teacherId),
      subjectId: String(upload.subjectId),
      filePath: String(upload.filePath),
    };
  }

  private normalizeUploadPatch(patch: Partial<Upload>): Partial<Upload> {
    return {
      ...patch,
      teacherId:
        patch.teacherId === undefined || patch.teacherId === null
          ? patch.teacherId
          : String(patch.teacherId),
      subjectId:
        patch.subjectId === undefined || patch.subjectId === null
          ? patch.subjectId
          : String(patch.subjectId),
      filePath:
        patch.filePath === undefined || patch.filePath === null
          ? patch.filePath
          : String(patch.filePath),
    };
  }
}
