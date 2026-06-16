import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { AssessmentResultEntity } from './entities/assessment-result.entity';
import { AssignmentEntity } from './entities/assignment.entity';
import { GradeEntity } from './entities/grade.entity';
import { InstitutionNotificationEntity } from './entities/institution-notification.entity';
import { InstitutionTaskEntity } from './entities/institution-task.entity';
import { PlanItemEntity } from './entities/plan-item.entity';
import { PlanLogEntity } from './entities/plan-log.entity';
import { PlanEntity } from './entities/plan.entity';
import { QuizEntity } from './entities/quiz.entity';
import { QuizResultEntity } from './entities/quiz-result.entity';
import { SchoolEntity } from './entities/school.entity';
import { SessionEntity } from './entities/session.entity';
import { StudentEntity } from './entities/student.entity';
import { SubjectOfferingEntity } from './entities/subject-offering.entity';
import { UploadEntity } from './entities/upload.entity';
import { UserEntity } from './entities/user.entity';
import { WeeklySlotsEntity } from './entities/weekly-slots.entity';
import { SqliteAssessmentResultsRepo } from './sqlite-assessment-result.repo';
import { SqliteAssignmentsRepo } from './sqlite-assignment.repo';
import { SqliteGradesRepo } from './sqlite-grade.repo';
import { SqliteInstitutionNotificationsRepo } from './sqlite-institution-notification.repo';
import { SqliteInstitutionTasksRepo } from './sqlite-institution-task.repo';
import { SqlitePlanItemsRepo } from './sqlite-plan-item.repo';
import { SqlitePlanLogsRepo } from './sqlite-plan-log.repo';
import { SqlitePlansRepo } from './sqlite-plan.repo';
import { SqliteQuizResultsRepo } from './sqlite-quiz-result.repo';
import { SqliteQuizzesRepo } from './sqlite-quiz.repo';
import { SqliteSchoolsRepo } from './sqlite-school.repo';
import { SqliteSessionsRepo } from './sqlite-session.repo';
import { SqliteStudentsRepo } from './sqlite-student.repo';
import { SqliteSubjectOfferingsRepo } from './sqlite-subject-offering.repo';
import { SqliteUploadsRepo } from './sqlite-upload.repo';
import { SqliteUsersRepo } from './sqlite-user.repo';
import { SqliteWeeklySlotsRepo } from './sqlite-weekly-slots.repo';

const databasePath = join(process.cwd(), 'data', 'bridge.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: databasePath,
      entities: [
        AssessmentResultEntity,
        AssignmentEntity,
        InstitutionNotificationEntity,
        InstitutionTaskEntity,
        GradeEntity,
        PlanItemEntity,
        PlanLogEntity,
        PlanEntity,
        QuizEntity,
        QuizResultEntity,
        SchoolEntity,
        SessionEntity,
        StudentEntity,
        SubjectOfferingEntity,
        UploadEntity,
        UserEntity,
        WeeklySlotsEntity,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      AssessmentResultEntity,
      AssignmentEntity,
      InstitutionNotificationEntity,
      InstitutionTaskEntity,
      GradeEntity,
      PlanItemEntity,
      PlanLogEntity,
      PlanEntity,
      QuizEntity,
      QuizResultEntity,
      SchoolEntity,
      SessionEntity,
      StudentEntity,
      SubjectOfferingEntity,
      UploadEntity,
      UserEntity,
      WeeklySlotsEntity,
    ]),
  ],
  providers: [
    SqliteAssessmentResultsRepo,
    SqliteAssignmentsRepo,
    SqliteInstitutionNotificationsRepo,
    SqliteInstitutionTasksRepo,
    SqliteGradesRepo,
    SqlitePlanItemsRepo,
    SqlitePlanLogsRepo,
    SqlitePlansRepo,
    SqliteQuizResultsRepo,
    SqliteQuizzesRepo,
    SqliteSchoolsRepo,
    SqliteSessionsRepo,
    SqliteStudentsRepo,
    SqliteSubjectOfferingsRepo,
    SqliteUploadsRepo,
    SqliteUsersRepo,
    SqliteWeeklySlotsRepo,
  ],
  exports: [
    SqliteAssessmentResultsRepo,
    SqliteAssignmentsRepo,
    SqliteInstitutionNotificationsRepo,
    SqliteInstitutionTasksRepo,
    SqliteGradesRepo,
    SqlitePlanItemsRepo,
    SqlitePlanLogsRepo,
    SqlitePlansRepo,
    SqliteQuizResultsRepo,
    SqliteQuizzesRepo,
    SqliteSchoolsRepo,
    SqliteSessionsRepo,
    SqliteStudentsRepo,
    SqliteSubjectOfferingsRepo,
    SqliteUploadsRepo,
    SqliteUsersRepo,
    SqliteWeeklySlotsRepo,
  ],
})
export class DatabaseModule {}
