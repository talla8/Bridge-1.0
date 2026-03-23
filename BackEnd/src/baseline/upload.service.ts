import { Injectable } from '@nestjs/common';
import { InMemoryUploadsRepo } from 'src/infrastructure/in-memory/in-memory-upload.repo';
import { UploadDTO } from './DTO/upload.dto';
import { Upload, Status } from 'src/domain/upload';
import { BaselineParserService } from './baselineParser.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly inMemoryUploadRepo: InMemoryUploadsRepo,
    private readonly baselineParserService: BaselineParserService,
  ) {}

  async create(uploadDto: UploadDTO | any): Promise<Upload> {
    return this.inMemoryUploadRepo.create({
      ...uploadDto,
      uploadId: '2', //find a way to asign it
      teacherId: '',
      subjectId: '',
      filePath: '',
      status: Status.UPLOADED, //handle status 
      createdAt: uploadDto.createdAt,
    }); //this is basically : create({file name, created at, the other hardcoded fileds that are reqiured for the upload entity})
  } // which means: create (an upload obj)

  async parseBaseline(file: Express.Multer.File): Promise<Record<string, unknown>[]> {
    return this.baselineParserService.parseBuffer(file.buffer);
  }

  async validateHeaders(buffer: Buffer): Promise<unknown> {
    return this.baselineParserService.validateHeaders(buffer);
  }

  async normalizeRows(buffer: Buffer): Promise<unknown> {
    return this.baselineParserService.normalizeRows(buffer);
  }
}
