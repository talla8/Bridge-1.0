import { Module } from '@nestjs/common';
import { BaselineController } from './baseline.controller';
import { UploadService } from './upload.service';
import { InMemoryUploadsRepo } from 'src/infrastructure/in-memory/in-memory-upload.repo';
import { BaselineParserService } from './baselineParser.service';

@Module({
  controllers: [BaselineController],
  providers: [UploadService, BaselineParserService, InMemoryUploadsRepo],
  exports: [BaselineModule],
})
export class BaselineModule {}
