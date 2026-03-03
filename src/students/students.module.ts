import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, InMemoryStudentsRepo],
})
export class StudentsModule {}
