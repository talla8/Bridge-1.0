import { Module } from '@nestjs/common';
import { BaselineController } from './baseline.controller';
import { UploadService } from './upload.service';
import { InMemoryUploadsRepo } from 'src/infrastructure/in-memory/in-memory-upload.repo';

@Module({
  controllers: [BaselineController],
  providers: [UploadService, InMemoryUploadsRepo],
})
export class BaselineModule {}
