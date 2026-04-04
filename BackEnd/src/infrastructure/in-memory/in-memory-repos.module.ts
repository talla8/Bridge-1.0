import { Module } from '@nestjs/common';
import { InMemoryAdminsRepo } from './in-memory-admin.repo';
import { InMemoryAssesmentResultsRepo } from './in-memory-assesmentResult.repo';
import { InMemoryAttendancesRepo } from './in-memory-attendance.repo';
import { InMemoryCurriculumItemsRepo } from './in-memory-curriculum-item.repo';
import { InMemoryGradesRepo } from './in-memory-grade.repo';
import { InMemoryParentsRepo } from './in-memory-parent.repo';
import { InMemoryPlansRepo } from './in-memory-plan.repo';
import { InMemoryPlanLogsRepo } from './in-memory-planLog.repo';
import { InMemorySchoolsRepo } from './in-memory-school.repo';
import { InMemorySkillsRepo } from './in-memory-skill.repo';
import { InMemorySkillCurriculumItemsRepo } from './in-memory-skill-curriculum-item.repo';
import { InMemoryStudentsRepo } from './in-memory-student.repo';
import { InMemorySubjectsRepo } from './in-memory-subject.repo';
import { InMemorySubjectOfferingsRepo } from './in-memory-subjectOffering.repo';
import { InMemoryTeachersRepo } from './in-memory-teacher.repo';
import { InMemoryUploadsRepo } from './in-memory-upload.repo';
import { InMemoryUsersRepo } from './in-memory-user.repo';
import { InMemoryVerificationTokensRepo } from './in-memory-verificationToken.repo';

@Module({
  providers: [
    InMemoryAdminsRepo,
    InMemoryAssesmentResultsRepo,
    InMemoryAttendancesRepo,
    InMemoryCurriculumItemsRepo,
    InMemoryGradesRepo,
    InMemoryParentsRepo,
    InMemoryPlansRepo,
    InMemoryPlanLogsRepo,
    InMemorySchoolsRepo,
    InMemorySkillsRepo,
    InMemorySkillCurriculumItemsRepo,
    InMemoryStudentsRepo,
    InMemorySubjectsRepo,
    InMemorySubjectOfferingsRepo,
    InMemoryTeachersRepo,
    InMemoryUploadsRepo,
    InMemoryUsersRepo,
    InMemoryVerificationTokensRepo,
  ],
  exports: [
    InMemoryAdminsRepo,
    InMemoryAssesmentResultsRepo,
    InMemoryAttendancesRepo,
    InMemoryCurriculumItemsRepo,
    InMemoryGradesRepo,
    InMemoryParentsRepo,
    InMemoryPlansRepo,
    InMemoryPlanLogsRepo,
    InMemorySchoolsRepo,
    InMemorySkillsRepo,
    InMemorySkillCurriculumItemsRepo,
    InMemoryStudentsRepo,
    InMemorySubjectsRepo,
    InMemorySubjectOfferingsRepo,
    InMemoryTeachersRepo,
    InMemoryUploadsRepo,
    InMemoryUsersRepo,
    InMemoryVerificationTokensRepo,
  ],
})
export class InMemoryReposModule {}
