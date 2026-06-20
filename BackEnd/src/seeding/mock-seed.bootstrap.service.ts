import { Injectable, OnModuleInit } from '@nestjs/common';
import { SqliteAssessmentResultsRepo } from 'src/database/sqlite-assessment-result.repo';
import { SqliteGradesRepo } from 'src/database/sqlite-grade.repo';
import { SqliteInstitutionNotificationsRepo } from 'src/database/sqlite-institution-notification.repo';
import { SqliteInstitutionTasksRepo } from 'src/database/sqlite-institution-task.repo';
import { SqlitePlanItemsRepo } from 'src/database/sqlite-plan-item.repo';
import { SqlitePlanLogsRepo } from 'src/database/sqlite-plan-log.repo';
import { SqlitePlansRepo } from 'src/database/sqlite-plan.repo';
import { SqliteSessionsRepo } from 'src/database/sqlite-session.repo';
import { SqliteStudentsRepo } from 'src/database/sqlite-student.repo';
import { SqliteSubjectOfferingsRepo } from 'src/database/sqlite-subject-offering.repo';
import { SqliteUsersRepo } from 'src/database/sqlite-user.repo';
import { InMemoryAdminsRepo } from 'src/infrastructure/in-memory/in-memory-admin.repo';
import { InMemoryAssesmentResultsRepo } from 'src/infrastructure/in-memory/in-memory-assesmentResult.repo';
import { InMemoryAttendancesRepo } from 'src/infrastructure/in-memory/in-memory-attendance.repo';
import { InMemoryCurriculumItemsRepo } from 'src/infrastructure/in-memory/in-memory-curriculum-item.repo';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';
import { InMemoryParentsRepo } from 'src/infrastructure/in-memory/in-memory-parent.repo';
import { InMemoryPlansRepo } from 'src/infrastructure/in-memory/in-memory-plan.repo';
import { InMemoryPlanItemsRepo } from 'src/infrastructure/in-memory/in-memory-plan-item.repo';
import { InMemoryPlanLogsRepo } from 'src/infrastructure/in-memory/in-memory-planLog.repo';
import { InMemorySchoolsRepo } from 'src/infrastructure/in-memory/in-memory-school.repo';
import { InMemorySessionsRepo } from 'src/infrastructure/in-memory/in-memory-session.repo';
import { InMemorySkillsRepo } from 'src/infrastructure/in-memory/in-memory-skill.repo';
import { InMemorySkillCurriculumItemsRepo } from 'src/infrastructure/in-memory/in-memory-skill-curriculum-item.repo';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';
import { InMemorySubjectsRepo } from 'src/infrastructure/in-memory/in-memory-subject.repo';
import { InMemorySubjectOfferingsRepo } from 'src/infrastructure/in-memory/in-memory-subjectOffering.repo';
import { InMemorySupportProgramsRepo } from 'src/infrastructure/in-memory/in-memory-support-program.repo';
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
    private readonly sqliteGradesRepo: SqliteGradesRepo,
    private readonly sqliteAssessmentResultsRepo: SqliteAssessmentResultsRepo,
    private readonly institutionNotificationsRepo: SqliteInstitutionNotificationsRepo,
    private readonly institutionTasksRepo: SqliteInstitutionTasksRepo,
    private readonly sqlitePlansRepo: SqlitePlansRepo,
    private readonly sqlitePlanItemsRepo: SqlitePlanItemsRepo,
    private readonly sqlitePlanLogsRepo: SqlitePlanLogsRepo,
    private readonly sqliteSessionsRepo: SqliteSessionsRepo,
    private readonly sqliteStudentsRepo: SqliteStudentsRepo,
    private readonly sqliteSubjectOfferingsRepo: SqliteSubjectOfferingsRepo,
    private readonly sqliteUsersRepo: SqliteUsersRepo,
    private readonly subjectsRepo: InMemorySubjectsRepo,
    private readonly studentsRepo: InMemoryStudentsRepo,
    private readonly uploadsRepo: InMemoryUploadsRepo,
    private readonly skillsRepo: InMemorySkillsRepo,
    private readonly curriculumItemsRepo: InMemoryCurriculumItemsRepo,
    private readonly plansRepo: InMemoryPlansRepo,
    private readonly planItemsRepo: InMemoryPlanItemsRepo,
    private readonly attendanceRepo: InMemoryAttendancesRepo,
    private readonly assessmentResultsRepo: InMemoryAssesmentResultsRepo,
    private readonly skillCurriculumItemsRepo: InMemorySkillCurriculumItemsRepo,
    private readonly planLogsRepo: InMemoryPlanLogsRepo,
    private readonly sessionsRepo: InMemorySessionsRepo,
    private readonly subjectOfferingsRepo: InMemorySubjectOfferingsRepo,
    private readonly supportProgramsRepo: InMemorySupportProgramsRepo,
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
      uploads: {
        repository: this.uploadsRepo,
        transformRows: async (rows) =>
          rows.map((row) => ({
            ...row,
            createdAt: row.createdAt ? new Date(String(row.createdAt)) : new Date(),
          })),
      },
      plans: {
        repository: this.plansRepo,
        transformRows: async (rows) =>
          rows.map((row) => ({
            ...row,
            startDate: row.startDate ? new Date(String(row.startDate)) : new Date(),
            sessions: Array.isArray(row.sessions)
              ? row.sessions.map((session) => ({
                  ...session,
                  sessionDate: session.sessionDate
                    ? new Date(String(session.sessionDate))
                    : new Date(),
                }))
              : [],
          })),
      },
      planLogs: {
        repository: this.planLogsRepo,
        transformRows: async (rows) =>
          rows.map((row) => ({
            ...row,
            createdAt: row.createdAt ? new Date(String(row.createdAt)) : new Date(),
          })),
      },
      parents: this.parentsRepo,
      teachers: this.teachersRepo,
      schools: this.schoolsRepo,
      grades: this.gradesRepo,
      subjects: this.subjectsRepo,
      subjectOfferings: this.subjectOfferingsRepo,
      students: {
        repository: this.studentsRepo,
        transformRows: async (rows) => {
          const grades = await this.gradesRepo.findAll();
          return rows.map((row) => {
            if (row.teacherId) {
              return row;
            }

            const matchingGrade = grades.find((grade) => {
              const sameGrade =
                String(grade.gradeId) === String(row.gradeId) ||
                String(grade.gradeName) === String(row.gradeId);
              const sameSchool =
                !row.schoolName ||
                !grade.schoolName ||
                String(grade.schoolName) === String(row.schoolName);

              return sameGrade && sameSchool;
            });

            return {
              ...row,
              teacherId: matchingGrade?.teacherId,
            };
          });
        },
      },
      skills: this.skillsRepo,
      curriculumItems: this.curriculumItemsRepo,
      attendance: this.attendanceRepo,
      assessmentResults: this.assessmentResultsRepo,
      skillCurriculumItems: this.skillCurriculumItemsRepo,
      supportPrograms: this.supportProgramsRepo,
      institutionNotifications: {
        repository: this.institutionNotificationsRepo,
        transformRows: async (rows) =>
          rows.map((row) => ({
            ...row,
            createdAt: row.createdAt ? new Date(String(row.createdAt)) : new Date(),
          })),
      },
      institutionTasks: {
        repository: this.institutionTasksRepo,
        transformRows: async (rows) =>
          rows.map((row) => ({
            ...row,
            createdAt: row.createdAt ? new Date(String(row.createdAt)) : new Date(),
            dueDate: row.dueDate ? new Date(String(row.dueDate)) : undefined,
            submittedAt: row.submittedAt
              ? new Date(String(row.submittedAt))
              : undefined,
          })),
      },
    });

    await seedFromMockData({
      grades: this.sqliteGradesRepo,
      assessmentResults: this.sqliteAssessmentResultsRepo,
      subjectOfferings: this.sqliteSubjectOfferingsRepo,
      plans: {
        repository: this.sqlitePlansRepo,
        transformRows: async (rows) =>
          rows.map((row) => ({
            ...row,
            startDate: row.startDate ? new Date(String(row.startDate)) : new Date(),
            sessions: Array.isArray(row.sessions)
              ? row.sessions.map((session) => ({
                  ...session,
                  sessionDate: session.sessionDate
                    ? new Date(String(session.sessionDate))
                    : new Date(),
                }))
              : [],
          })),
      },
      planLogs: {
        repository: this.sqlitePlanLogsRepo,
        transformRows: async (rows) =>
          rows.map((row) => ({
            ...row,
            createdAt: row.createdAt ? new Date(String(row.createdAt)) : new Date(),
          })),
      },
      students: {
        repository: this.sqliteStudentsRepo,
        transformRows: async (rows) => {
          const grades = await this.sqliteGradesRepo.findAll();
          return rows.map((row) => {
            if (row.teacherId) {
              return row;
            }

            const matchingGrade = grades.find((grade) => {
              const sameGrade =
                String(grade.gradeId) === String(row.gradeId) ||
                String(grade.gradeName) === String(row.gradeId);
              const sameSchool =
                !row.schoolName ||
                !grade.schoolName ||
                String(grade.schoolName) === String(row.schoolName);

              return sameGrade && sameSchool;
            });

            return {
              ...row,
              teacherId: matchingGrade?.teacherId,
            };
          });
        },
      },
      users: {
        repository: this.sqliteUsersRepo,
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
    });

    await this.hydrateSeededPlans();
    await this.hydrateSeededSqlitePlans();
  }

  private async hydrateSeededPlans(): Promise<void> {
    const plans = await this.plansRepo.findAll();

    for (const plan of plans) {
      for (const session of plan.sessions ?? []) {
        const existingSession = await this.sessionsRepo.findById(session.sessionId);
        if (!existingSession) {
          await this.sessionsRepo.create(session);
        }

        for (const item of session.items ?? []) {
          const existingItem = await this.planItemsRepo.findById(item.planItemId);
          if (!existingItem) {
            await this.planItemsRepo.create(item);
          }
        }
      }
    }
  }

  private async hydrateSeededSqlitePlans(): Promise<void> {
    const plans = await this.sqlitePlansRepo.findAll();

    for (const plan of plans) {
      for (const session of plan.sessions ?? []) {
        const existingSession = await this.sqliteSessionsRepo.findById(
          session.sessionId,
        );
        if (!existingSession) {
          await this.sqliteSessionsRepo.create(session);
        }

        for (const item of session.items ?? []) {
          const existingItem = await this.sqlitePlanItemsRepo.findById(
            item.planItemId,
          );
          if (!existingItem) {
            await this.sqlitePlanItemsRepo.create(item);
          }
        }
      }
    }
  }
}
