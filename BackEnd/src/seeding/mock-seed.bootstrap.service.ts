import { Injectable, OnModuleInit } from '@nestjs/common';
import { InMemoryAdminsRepo } from 'src/infrastructure/in-memory/in-memory-admin.repo';
import { InMemoryAssesmentResultsRepo } from 'src/infrastructure/in-memory/in-memory-assesmentResult.repo';
import { InMemoryAttendancesRepo } from 'src/infrastructure/in-memory/in-memory-attendance.repo';
import { InMemoryExercisesRepo } from 'src/infrastructure/in-memory/in-memory-exercise.repo';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';
import { InMemoryParentsRepo } from 'src/infrastructure/in-memory/in-memory-parent.repo';
import { InMemoryPlansRepo } from 'src/infrastructure/in-memory/in-memory-plan.repo';
import { InMemoryPlanLogsRepo } from 'src/infrastructure/in-memory/in-memory-planLog.repo';
import { InMemorySchoolsRepo } from 'src/infrastructure/in-memory/in-memory-school.repo';
import { InMemorySkillsRepo } from 'src/infrastructure/in-memory/in-memory-skill.repo';
import { InMemorySkillExercisesRepo } from 'src/infrastructure/in-memory/in-memory-skillExercise.repo';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';
import { InMemorySubjectsRepo } from 'src/infrastructure/in-memory/in-memory-subject.repo';
import { InMemorySubjectOfferingsRepo } from 'src/infrastructure/in-memory/in-memory-subjectOffering.repo';
import { InMemoryTeachersRepo } from 'src/infrastructure/in-memory/in-memory-teacher.repo';
import { InMemoryUploadsRepo } from 'src/infrastructure/in-memory/in-memory-upload.repo';
import { InMemoryUsersRepo } from 'src/infrastructure/in-memory/in-memory-user.repo';
import { hashPassword, isBcryptHash } from 'src/auth/passwordHash';
import { seedFromMockData } from './seed-from-mock-data';

@Injectable()
export class MockSeedBootstrapService implements OnModuleInit {
  constructor(
    private readonly usersRepo: InMemoryUsersRepo,
    private readonly parentsRepo: InMemoryParentsRepo,
    private readonly teachersRepo: InMemoryTeachersRepo,
    private readonly schoolsRepo: InMemorySchoolsRepo,
    private readonly gradesRepo: InMemoryGradesRepo,
    private readonly subjectsRepo: InMemorySubjectsRepo,
    private readonly studentsRepo: InMemoryStudentsRepo,
    private readonly uploadsRepo: InMemoryUploadsRepo,
    private readonly skillsRepo: InMemorySkillsRepo,
    private readonly exercisesRepo: InMemoryExercisesRepo,
    private readonly plansRepo: InMemoryPlansRepo,
    private readonly attendanceRepo: InMemoryAttendancesRepo,
    private readonly assessmentResultsRepo: InMemoryAssesmentResultsRepo,
    private readonly skillExercisesRepo: InMemorySkillExercisesRepo,
    private readonly planLogsRepo: InMemoryPlanLogsRepo,
    private readonly subjectOfferingsRepo: InMemorySubjectOfferingsRepo,
    private readonly adminsRepo: InMemoryAdminsRepo,
  ) {}

  async onModuleInit(): Promise<void> {
    await seedFromMockData({
      admins: this.adminsRepo,
      users: {
        repository: this.usersRepo,
        transformRows: async (rows) =>
          Promise.all(
            rows.map(async (row) => {
              const { password, ...seededUser } = row;
              const seededPassword = String(password ?? row.passwordHash ?? '');

              if (!seededPassword) {
                throw new Error(
                  `Seeded user "${String(row.email ?? row.userId ?? 'unknown')}" is missing a password.`,
                );
              }

              return {
                ...seededUser,
                passwordHash: isBcryptHash(seededPassword)
                  ? seededPassword
                  : await hashPassword(seededPassword),
              };
            }),
          ),
      },
      parents: this.parentsRepo,
      teachers: this.teachersRepo,
      schools: this.schoolsRepo,
      grades: this.gradesRepo,
      subjects: this.subjectsRepo,
      subjectOfferings: this.subjectOfferingsRepo,
      students: this.studentsRepo,
      uploads: this.uploadsRepo,
      skills: this.skillsRepo,
      exercises: this.exercisesRepo,
      plans: this.plansRepo,
      attendance: this.attendanceRepo,
      assessmentResults: this.assessmentResultsRepo,
      skillExercises: this.skillExercisesRepo,
      planLogs: this.planLogsRepo,
    });
  }
}
