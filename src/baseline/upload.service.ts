import { Injectable } from '@nestjs/common';
import { InMemoryUploadsRepo } from 'src/infrastructure/in-memory/in-memory-upload.repo';
import { UploadDTO } from './DTO/upload.dto';
import { Upload } from 'src/domain/upload';
import { Status } from 'src/domain/planLog';

@Injectable()
export class UploadService {
  constructor(private readonly inMemoryUploadRepo: InMemoryUploadsRepo) {}

  async create(uploadDto: UploadDTO | any): Promise<Upload> {
    return this.inMemoryUploadRepo.create({
      ...uploadDto,
      uploadId: '2', //find a way to asign it
      teacherId: '',
      subjectId: '',
      filePath: '',
      status: Status.DONE,
      createdAt: uploadDto.createdAt,
    }); //this is basically : create({file name, created at, the other hardcoded fileds that are reqiured for the upload entity})
  } // which means: create (an upload obj)
}
