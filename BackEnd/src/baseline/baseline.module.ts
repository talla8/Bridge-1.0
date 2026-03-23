import { Module } from '@nestjs/common';
import { BaselineController } from './baseline.controller';
import { UploadService } from './upload.service';
import { BaselineParserService } from './baselineParser.service';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StudentMatchingServiceService } from './student-matching-service.service';
import { StudentsModule } from 'src/students/students.module';
import { BaselineProcessingServiceService } from './baseline-processing-service.service';

@Module({
  imports: [InMemoryReposModule, StudentsModule],
  controllers: [BaselineController],
  providers: [
    UploadService,
    BaselineParserService,
    StudentMatchingServiceService,
    BaselineProcessingServiceService,
  ],
  exports: [
    UploadService,
    StudentMatchingServiceService,
    BaselineProcessingServiceService,
  ],
})
export class BaselineModule {}
