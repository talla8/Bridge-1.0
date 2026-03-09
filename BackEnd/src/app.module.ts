import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InMemoryAdminsRepo } from './infrastructure/in-memory/in-memory-admin.repo';
import { InMemoryAssesmentResultsRepo } from './infrastructure/in-memory/in-memory-assesmentResult.repo';
import { InMemoryAttendancesRepo } from './infrastructure/in-memory/in-memory-attendance.repo';
import { InMemoryExercisesRepo } from './infrastructure/in-memory/in-memory-exercise.repo';
import { InMemoryGradesRepo } from './infrastructure/in-memory/in-memory-grade.repo';
import { InMemoryParentsRepo } from './infrastructure/in-memory/in-memory-parent.repo';
import { InMemoryPlansRepo } from './infrastructure/in-memory/in-memory-plan.repo';
import { InMemoryPlanLogsRepo } from './infrastructure/in-memory/in-memory-planLog.repo';
import { InMemorySchoolsRepo } from './infrastructure/in-memory/in-memory-school.repo';
import { InMemorySkillsRepo } from './infrastructure/in-memory/in-memory-skill.repo';
import { InMemorySkillExercisesRepo } from './infrastructure/in-memory/in-memory-skillExercise.repo';
import { InMemoryStudentsRepo } from './infrastructure/in-memory/in-memory-student.repo';
import { InMemorySubjectsRepo } from './infrastructure/in-memory/in-memory-subject.repo';
import { InMemorySubjectOfferingsRepo } from './infrastructure/in-memory/in-memory-subjectOffering.repo';
import { InMemoryTeachersRepo } from './infrastructure/in-memory/in-memory-teacher.repo';
import { InMemoryUploadsRepo } from './infrastructure/in-memory/in-memory-upload.repo';
import { MockSeedBootstrapService } from './seeding/mock-seed.bootstrap.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { BaselineModule } from './baseline/baseline.module';
import { PlansModule } from './plans/plans.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './baseline/upload.service';
import { BaselineParserService } from './baseline/baselineParser.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    StudentsModule,
    BaselineModule,
    PlansModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    InMemoryAdminsRepo,
    InMemoryAssesmentResultsRepo,
    InMemoryAttendancesRepo,
    InMemoryExercisesRepo,
    InMemoryGradesRepo,
    InMemoryParentsRepo,
    InMemoryPlansRepo,
    InMemoryPlanLogsRepo,
    InMemorySchoolsRepo,
    InMemorySkillsRepo,
    InMemorySkillExercisesRepo,
    InMemoryStudentsRepo,
    InMemorySubjectsRepo,
    InMemorySubjectOfferingsRepo,
    InMemoryTeachersRepo,
    InMemoryUploadsRepo,
    MockSeedBootstrapService,
    UploadService,
    AuthModule,
    BaselineParserService,
  ],
})
export class AppModule {}
