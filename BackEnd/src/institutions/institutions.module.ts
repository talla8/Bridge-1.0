import { Module } from '@nestjs/common';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StatisticsModule } from 'src/statistics/statistics.module';
import { StudentsModule } from 'src/students/students.module';
import { UsersModule } from 'src/users/users.module';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { TeacherInboxController } from './teacher-inbox.controller';

@Module({
  imports: [UsersModule, StudentsModule, StatisticsModule, InMemoryReposModule],
  controllers: [InstitutionsController, TeacherInboxController],
  providers: [InstitutionsService],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}
