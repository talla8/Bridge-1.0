import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { UsersModule } from 'src/users/users.module';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StudentUploadService } from './student-upload.service';

@Module({
  imports: [UsersModule, InMemoryReposModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentUploadService],
  exports: [StudentsService],
})
export class StudentsModule {}
