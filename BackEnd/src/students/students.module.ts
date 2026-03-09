import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';
import { InMemoryUsersRepo } from 'src/infrastructure/in-memory/in-memory-user.repo';

@Module({
  controllers: [StudentsController],
  providers: [
    StudentsService,
    InMemoryStudentsRepo,
    InMemoryGradesRepo,
    InMemoryUsersRepo,
  ],
})
export class StudentsModule {}
