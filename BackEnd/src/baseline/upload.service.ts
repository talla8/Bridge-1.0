import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SubjectId, UploadId, UserId } from 'src/domain/ids';
import { SqliteUploadsRepo } from 'src/database/sqlite-upload.repo';
import { UploadDTO } from './DTO/upload.dto';
import { Upload, Status } from 'src/domain/upload';
import { BaselineParserService } from './baselineParser.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly sqliteUploadsRepo: SqliteUploadsRepo,
    private readonly baselineParserService: BaselineParserService,
  ) {}

  async create(uploadDto: UploadDTO): Promise<Upload> {
    return this.sqliteUploadsRepo.create({
      ...uploadDto,
      uploadId: randomUUID(),
      status: uploadDto.status ?? Status.UPLOADED,
      createdAt: uploadDto.createdAt ?? new Date(),
    });
  }

  async parseBaseline(file: Express.Multer.File): Promise<Record<string, unknown>[]> {
    return this.baselineParserService.parseBuffer(file.buffer);
  }

  async validateHeaders(buffer: Buffer, subjectId?: SubjectId): Promise<unknown> {
    return this.baselineParserService.validateHeaders(buffer, subjectId);
  }

  async normalizeRows(buffer: Buffer, subjectId?: SubjectId): Promise<unknown> {
    return this.baselineParserService.normalizeRows(buffer, subjectId);
  }

  async findById(uploadId: UploadId): Promise<Upload | null> {
    return this.sqliteUploadsRepo.findById(String(uploadId));
  }

  async findLatestForTeacherSubject(
    teacherId: UserId,
    subjectId: SubjectId,
  ): Promise<Upload | null> {
    const uploads = await this.sqliteUploadsRepo.findAll();
    return (
      uploads.find(
        (upload) =>
          String(upload.teacherId) === String(teacherId) &&
          String(upload.subjectId) === String(subjectId),
      ) ?? null
    );
  }

  async updateStatus(
    uploadId: UploadId,
    status: Status,
  ): Promise<Upload> {
    const updated = await this.sqliteUploadsRepo.update(String(uploadId), {
      status,
    });
    if (!updated) {
      throw new NotFoundException(`Upload ${String(uploadId)} was not found.`);
    }

    return updated;
  }
}
