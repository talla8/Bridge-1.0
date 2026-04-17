import { Module } from '@nestjs/common';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StatisticsModule } from 'src/statistics/statistics.module';
import { StudentsModule } from 'src/students/students.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [InMemoryReposModule, StudentsModule, StatisticsModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
