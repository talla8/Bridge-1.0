import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { SqliteInstitutionNotificationsRepo } from 'src/database/sqlite-institution-notification.repo';
import { SqliteInstitutionTasksRepo } from 'src/database/sqlite-institution-task.repo';
import { SqliteGradesRepo } from 'src/database/sqlite-grade.repo';
import { SqlitePlansRepo } from 'src/database/sqlite-plan.repo';
import { SqlitePlanLogsRepo } from 'src/database/sqlite-plan-log.repo';
import { SqliteSubjectOfferingsRepo } from 'src/database/sqlite-subject-offering.repo';
import { Grade } from 'src/domain/grade';
import { UserId } from 'src/domain/ids';
import { SubjectOffering } from 'src/domain/subjectOffering';
import { RoleId, User } from 'src/domain/user';
import { InMemorySchoolsRepo } from 'src/infrastructure/in-memory/in-memory-school.repo';
import { InMemorySubjectsRepo } from 'src/infrastructure/in-memory/in-memory-subject.repo';
import { PlansService } from 'src/plans/plans.service';
import { StatisticsService } from 'src/statistics/statistics.service';
import { StudentsService } from 'src/students/students.service';
import { UsersService } from 'src/users/users.service';
import { CreateInstitutionNotificationDTO } from './DTO/create-notification.dto';
import { CreateInstitutionTaskDTO } from './DTO/create-task.dto';
import { CreateInstitutionTeacherDTO } from './DTO/create-teacher.dto';
import { InstitutionNotification } from './domain/institution-notification';
import {
  InstitutionNotificationSenderRole,
} from './domain/institution-notification';
import {
  InstitutionTask,
  InstitutionTaskStatus,
  InstitutionTaskSubmission,
} from './domain/institution-task';
import { CreateTeacherMessageDTO } from './DTO/create-teacher-message.dto';
import { SubmitInstitutionTaskDTO } from './DTO/submit-task.dto';

type TeacherSchoolSummary = {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  grade: string | null;
  section: string | null;
  subject: string | null;
  studentCount: number | null;
  classAverage: number | null;
  weakStudentCount: number | null;
  hasGeneratedPlan: boolean;
  progressPercentage: number | null;
  classSpeedPercentage: number | null;
  behindPace: boolean;
  latestActivityAt: Date | null;
};

type TeacherSubjectDetailSummary = {
  subjectId: string;
  subjectName: string;
  studentCount: number | null;
  classAverage: number | null;
  weakStudentCount: number | null;
  hasGeneratedPlan: boolean;
  progressPercentage: number | null;
  classSpeedPercentage: number | null;
  behindPace: boolean;
};

type TeacherOverviewSubjectRow = {
  teacherUserId: string;
  fullName: string;
  email: string;
  grade: string | null;
  section: string | null;
  subjectName: string;
  isRegisteredForSubject: boolean;
  studentCount: number | null;
  classAverage: number | null;
  weakStudentCount: number | null;
  hasGeneratedPlan: boolean;
  progressPercentage: number | null;
};

@Injectable()
export class InstitutionsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly schoolsRepo: InMemorySchoolsRepo,
    private readonly gradesRepo: SqliteGradesRepo,
    private readonly subjectOfferingsRepo: SqliteSubjectOfferingsRepo,
    private readonly subjectsRepo: InMemorySubjectsRepo,
    private readonly studentsService: StudentsService,
    private readonly statisticsService: StatisticsService,
    private readonly plansService: PlansService,
    private readonly plansRepo: SqlitePlansRepo,
    private readonly planLogsRepo: SqlitePlanLogsRepo,
    private readonly institutionNotificationsRepo: SqliteInstitutionNotificationsRepo,
    private readonly institutionTasksRepo: SqliteInstitutionTasksRepo,
  ) {}

  async getInstitutionProfile(adminUserId: UserId) {
    const { user, school } = await this.getInstitutionContext(adminUserId);
    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      teacherJoinCode: school.teacherJoinCode ?? null,
      teacherSelfRegistrationEnabled:
        school.teacherSelfRegistrationEnabled ?? true,
    };
  }

  async getDashboard(adminUserId: UserId) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const teachers = await this.getSchoolTeachersBySchoolId(school.schoolId);
    const teacherSummaries = await Promise.all(
      teachers.map(async (teacher) => ({
        summary: await this.buildTeacherSummary(teacher, school.schoolId),
        subjectDetails: await this.buildTeacherSubjectDetails(
          teacher,
          school.schoolId,
        ),
      })),
    );

    const teacherSummaryRows = teacherSummaries.map((item) => item.summary);

    const activeTeachers = teacherSummaryRows.filter((teacher) => teacher.isActive).length;
    const teachersWithPlans = teacherSummaryRows.filter((teacher) => teacher.hasGeneratedPlan).length;
    const teachersWithoutPlans = teacherSummaryRows.length - teachersWithPlans;
    const behindPaceClasses = teacherSummaryRows.filter(
      (teacher) => teacher.behindPace,
    ).length;

    const overviewSubjects = ['Arabic', 'Mathematics'];
    const teacherOverviewRows = teacherSummaries.flatMap(({ summary, subjectDetails }) =>
      overviewSubjects.map((subjectName) => {
        const subjectDetail =
          subjectDetails.find((item) => item.subjectName === subjectName) ?? null;

        return {
          teacherUserId: String(summary.userId),
          fullName: summary.fullName,
          email: summary.email,
          grade: summary.grade,
          section: summary.section,
          subjectName,
          isRegisteredForSubject: Boolean(subjectDetail),
          studentCount: subjectDetail?.studentCount ?? null,
          classAverage: subjectDetail?.classAverage ?? null,
          weakStudentCount: subjectDetail?.weakStudentCount ?? null,
          hasGeneratedPlan: Boolean(subjectDetail?.hasGeneratedPlan),
          progressPercentage: subjectDetail?.progressPercentage ?? null,
        } as TeacherOverviewSubjectRow;
      }),
    );

    const classAverageValues = teacherOverviewRows
      .filter((row) => row.isRegisteredForSubject)
      .map((row) => row.classAverage)
      .filter((value): value is number => value !== null);
    const averageClassScore = classAverageValues.length
      ? Math.round(
          classAverageValues.reduce((sum, value) => sum + value, 0) /
            classAverageValues.length,
        )
      : 0;

    const weakStudents = teacherSummaryRows.reduce(
      (sum, teacher) => sum + (teacher.weakStudentCount ?? 0),
      0,
    );

    return {
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      totalTeachers: teacherSummaryRows.length,
      activeTeachers,
      teachersWithPlans,
      teachersWithoutPlans,
      averageClassScore,
      weakStudents,
      behindPaceClasses,
      recentNotifications: (await this.institutionNotificationsRepo.findAll())
        .filter((item) => String(item.schoolId) === String(school.schoolId))
        .filter(
          (item) =>
            item.senderRole === InstitutionNotificationSenderRole.TEACHER,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      openTasks: (await this.institutionTasksRepo.findAll())
        .map((item) => this.withEffectiveTaskStatus(item))
        .filter(
          (item) =>
            String(item.schoolId) === String(school.schoolId) &&
            item.status === InstitutionTaskStatus.OPEN,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      overviewSubjects,
      teacherOverviewRows,
      teachers: teacherSummaryRows,
    };
  }

  async getTeachers(adminUserId: UserId) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const teachers = await this.getSchoolTeachersBySchoolId(school.schoolId);
    return Promise.all(
      teachers.map((teacher) => this.buildTeacherSummary(teacher, school.schoolId)),
    );
  }

  async getTeacherDetail(adminUserId: UserId, teacherUserId: string) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const teacher = await this.getTeacherInSchool(school.schoolId, teacherUserId);
    const summary = await this.buildTeacherSummary(teacher, school.schoolId);
    const subjectDetails = await this.buildTeacherSubjectDetails(
      teacher,
      school.schoolId,
    );
    const teacherPlans = (await this.plansRepo.findAll()).filter(
      (plan) => String(plan.teacherId) === String(teacher.userId),
    );
    const teacherPlanIds = new Set(teacherPlans.map((plan) => String(plan.planId)));
    const activity = (await this.planLogsRepo.findAll())
      .filter((item) => teacherPlanIds.has(String(item.planId)))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const notifications = (await this.institutionNotificationsRepo.findAll()).filter(
      (item) =>
        String(item.schoolId) === String(school.schoolId) &&
        item.senderRole === InstitutionNotificationSenderRole.TEACHER &&
        String(item.createdByUserId) === String(teacherUserId),
    );

    const tasks = (await this.institutionTasksRepo.findAll()).filter(
      (item) =>
        String(item.schoolId) === String(school.schoolId) &&
        item.assignedTeacherUserIds.some(
          (candidate) => String(candidate) === String(teacherUserId),
        ),
    );

    return {
      ...summary,
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      recentActivity: activity,
      subjectDetails,
      notifications,
      tasks: tasks.map((item) => this.withEffectiveTaskStatus(item)),
    };
  }

  async createTeacher(adminUserId: UserId, dto: CreateInstitutionTeacherDTO) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const existingUser = await this.usersService.findbyEmail(dto.email.trim());
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const subjects = await this.subjectsRepo.findAll();
    const requiredSubjects = subjects.filter(
      (subject) =>
        subject.subjectName === 'Arabic' || subject.subjectName === 'Mathematics',
    );
    if (requiredSubjects.length < 2) {
      throw new NotFoundException(
        'Arabic and Mathematics subjects must exist before creating teachers',
      );
    }

    const userId = `user_${randomUUID()}`;
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      userId,
      fullName: dto.fullName.trim(),
      email: dto.email.trim(),
      phoneNumber: dto.phoneNumber?.trim() || undefined,
      schoolId: school.schoolId,
      passwordHash,
      roleId: RoleId.TEACHER,
      isActive: true,
      isVerified: false,
    });

    if (!user) {
      throw new BadRequestException('Unable to create teacher account');
    }

    await this.gradesRepo.create({
      gradeId: dto.grade,
      gradeName: dto.grade,
      gradeSection: dto.section?.trim() || null,
      schoolName: school.schoolName,
      teacherId: user.userId,
    } as Grade);

    for (const subject of requiredSubjects) {
      await this.subjectOfferingsRepo.create({
        subjectOfferingId: `subject_offering_${randomUUID()}`,
        subjectId: subject.subjectId,
        gradeId: dto.grade,
        teacherId: user.userId,
        schoolId: school.schoolId,
        schoolYear: this.getCurrentSchoolYear(),
      } as SubjectOffering);
    }

    return this.buildTeacherSummary(user, school.schoolId);
  }

  async getTeacherJoinCode(adminUserId: UserId) {
    const { school } = await this.getInstitutionContext(adminUserId);
    return {
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      teacherJoinCode: school.teacherJoinCode ?? null,
      teacherSelfRegistrationEnabled:
        school.teacherSelfRegistrationEnabled ?? true,
    };
  }

  async regenerateTeacherJoinCode(adminUserId: UserId) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const updated = await this.schoolsRepo.update(school.schoolId, {
      teacherJoinCode: this.generateTeacherJoinCode(),
    });
    if (!updated) {
      throw new NotFoundException('School not found');
    }

    return {
      schoolId: updated.schoolId,
      schoolName: updated.schoolName,
      teacherJoinCode: updated.teacherJoinCode ?? null,
      teacherSelfRegistrationEnabled:
        updated.teacherSelfRegistrationEnabled ?? true,
    };
  }

  async toggleTeacherSelfRegistration(adminUserId: UserId, enabled: boolean) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const updated = await this.schoolsRepo.update(school.schoolId, {
      teacherSelfRegistrationEnabled: enabled,
    });
    if (!updated) {
      throw new NotFoundException('School not found');
    }

    return {
      schoolId: updated.schoolId,
      schoolName: updated.schoolName,
      teacherJoinCode: updated.teacherJoinCode ?? null,
      teacherSelfRegistrationEnabled:
        updated.teacherSelfRegistrationEnabled ?? true,
    };
  }

  async getNotifications(adminUserId: UserId) {
    const { school } = await this.getInstitutionContext(adminUserId);
    return (await this.institutionNotificationsRepo.findAll())
      .filter((item) => String(item.schoolId) === String(school.schoolId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(
    adminUserId: UserId,
    dto: CreateInstitutionNotificationDTO,
  ) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const recipientTeacherUserIds = dto.recipientTeacherEmails?.length
      ? await this.resolveTeacherUserIdsByEmails(
          school.schoolId,
          dto.recipientTeacherEmails,
        )
      : (dto.recipientTeacherUserIds ?? []).map(String);

    await this.assertTeachersBelongToSchool(school.schoolId, recipientTeacherUserIds);

    const notification: InstitutionNotification = {
      notificationId: `notification_${randomUUID()}`,
      schoolId: school.schoolId,
      createdByUserId: adminUserId,
      title: dto.title.trim(),
      message: dto.message.trim(),
      recipientTeacherUserIds,
      senderRole: InstitutionNotificationSenderRole.INSTITUTION,
      attachments: (dto.attachments ?? [])
        .map((item) => String(item).trim())
        .filter(Boolean),
      createdAt: new Date(),
    };
    return this.institutionNotificationsRepo.create(notification);
  }

  async getTasks(adminUserId: UserId) {
    const { school } = await this.getInstitutionContext(adminUserId);
    return (await this.institutionTasksRepo.findAll())
      .filter((item) => String(item.schoolId) === String(school.schoolId))
      .map((item) => this.withEffectiveTaskStatus(item))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTask(adminUserId: UserId, dto: CreateInstitutionTaskDTO) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const assignedTeacherUserIds = dto.assignedTeacherEmails?.length
      ? await this.resolveTeacherUserIdsByEmails(
          school.schoolId,
          dto.assignedTeacherEmails,
        )
      : (dto.assignedTeacherUserIds ?? []).map(String);

    if (!assignedTeacherUserIds.length) {
      throw new BadRequestException('At least one teacher email is required');
    }

    await this.assertTeachersBelongToSchool(school.schoolId, assignedTeacherUserIds);

    const task: InstitutionTask = {
      taskId: `task_${randomUUID()}`,
      schoolId: school.schoolId,
      createdByUserId: adminUserId,
      title: dto.title.trim(),
      description: dto.description?.trim() || undefined,
      assignedTeacherUserIds,
      attachments: (dto.attachments ?? [])
        .map((item) => String(item).trim())
        .filter(Boolean),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: InstitutionTaskStatus.OPEN,
      isHidden: false,
      submissions: [],
      createdAt: new Date(),
    };
    return this.institutionTasksRepo.create(task);
  }

  async updateTaskStatus(
    adminUserId: UserId,
    taskId: string,
    status: InstitutionTaskStatus,
  ) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const task = await this.institutionTasksRepo.findById(taskId);
    if (!task || String(task.schoolId) !== String(school.schoolId)) {
      throw new NotFoundException('Task not found.');
    }

    const patch: Partial<InstitutionTask> = { status };
    if (status === InstitutionTaskStatus.OPEN) {
      patch.submissions = [];
    }

    const updated = await this.institutionTasksRepo.update(taskId, patch);
    if (!updated) {
      throw new NotFoundException('Task not found.');
    }
    return updated;
  }

  async updateTaskVisibility(
    adminUserId: UserId,
    taskId: string,
    isHidden: boolean,
  ) {
    const { school } = await this.getInstitutionContext(adminUserId);
    const task = await this.institutionTasksRepo.findById(taskId);
    if (!task || String(task.schoolId) !== String(school.schoolId)) {
      throw new NotFoundException('Task not found.');
    }

    const updated = await this.institutionTasksRepo.update(taskId, {
      isHidden,
    });
    if (!updated) {
      throw new NotFoundException('Task not found.');
    }
    return this.withEffectiveTaskStatus(updated);
  }

  async getTeacherNotifications(teacherUserId: UserId) {
    const teacher = await this.usersService.findById(teacherUserId);
    if (!teacher || teacher.roleId !== RoleId.TEACHER || !teacher.schoolId) {
      throw new ForbiddenException('Teacher institution inbox is unavailable');
    }

    return (await this.institutionNotificationsRepo.findAll())
      .filter(
        (item) =>
          String(item.schoolId) === String(teacher.schoolId) &&
          (!item.recipientTeacherUserIds?.length ||
            item.recipientTeacherUserIds.some(
              (candidate) => String(candidate) === String(teacherUserId),
            )),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTeacherTasks(teacherUserId: UserId) {
    const teacher = await this.usersService.findById(teacherUserId);
    if (!teacher || teacher.roleId !== RoleId.TEACHER || !teacher.schoolId) {
      throw new ForbiddenException('Teacher institution inbox is unavailable');
    }

    return (await this.institutionTasksRepo.findAll())
      .filter(
        (item) =>
          String(item.schoolId) === String(teacher.schoolId) &&
          !item.isHidden &&
          item.assignedTeacherUserIds.some(
            (candidate) => String(candidate) === String(teacherUserId),
          ),
      )
      .map((item) => this.withEffectiveTaskStatus(item))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTeacherMessage(teacherUserId: UserId, dto: CreateTeacherMessageDTO) {
    const teacher = await this.usersService.findById(teacherUserId);
    if (!teacher || teacher.roleId !== RoleId.TEACHER || !teacher.schoolId) {
      throw new ForbiddenException('Teacher institution inbox is unavailable');
    }

    const notification: InstitutionNotification = {
      notificationId: `notification_${randomUUID()}`,
      schoolId: teacher.schoolId,
      createdByUserId: teacherUserId,
      title: dto.title.trim(),
      message: dto.message.trim(),
      recipientTeacherUserIds: [],
      senderRole: InstitutionNotificationSenderRole.TEACHER,
      attachments: (dto.attachments ?? [])
        .map((item) => String(item).trim())
        .filter(Boolean),
      createdAt: new Date(),
    };
    return this.institutionNotificationsRepo.create(notification);
  }

  async submitTeacherTask(
    teacherUserId: UserId,
    taskId: string,
    dto: SubmitInstitutionTaskDTO,
  ) {
    return this.upsertTeacherTaskSubmission(
      teacherUserId,
      taskId,
      dto,
      false,
    );
  }

  async resubmitTeacherTask(
    teacherUserId: UserId,
    taskId: string,
    dto: SubmitInstitutionTaskDTO,
  ) {
    return this.upsertTeacherTaskSubmission(
      teacherUserId,
      taskId,
      dto,
      true,
    );
  }

  private async upsertTeacherTaskSubmission(
    teacherUserId: UserId,
    taskId: string,
    dto: SubmitInstitutionTaskDTO,
    requireExistingSubmission: boolean,
  ) {
    const teacher = await this.usersService.findById(teacherUserId);
    if (!teacher || teacher.roleId !== RoleId.TEACHER || !teacher.schoolId) {
      throw new ForbiddenException('Teacher institution inbox is unavailable');
    }

    const task = await this.institutionTasksRepo.findById(taskId);
    if (!task || String(task.schoolId) !== String(teacher.schoolId)) {
      throw new NotFoundException('Task not found.');
    }

    if (
      !task.assignedTeacherUserIds.some(
        (candidate) => String(candidate) === String(teacherUserId),
      )
    ) {
      throw new ForbiddenException('Task is not assigned to this teacher.');
    }

    const effectiveTask = this.withEffectiveTaskStatus(task);
    if (effectiveTask.status !== InstitutionTaskStatus.OPEN) {
      throw new BadRequestException('Task is closed.');
    }

    const nextSubmission: InstitutionTaskSubmission = {
      teacherUserId,
      submittedAt: new Date(),
      message: dto.message?.trim() || undefined,
      attachments: (dto.attachments ?? [])
        .map((item) => String(item).trim())
        .filter(Boolean),
    };
    const existingSubmissions = Array.isArray(task.submissions)
      ? task.submissions
      : [];
    const existingSubmission = existingSubmissions.find(
      (submission) =>
        String(submission.teacherUserId) === String(teacherUserId),
    );

    if (requireExistingSubmission && !existingSubmission) {
      throw new BadRequestException(
        'You cannot resubmit a task that has not been submitted yet.',
      );
    }

    if (!requireExistingSubmission && existingSubmission) {
      throw new BadRequestException(
        'You have already submitted this task. Use resubmit instead.',
      );
    }

    const filteredSubmissions = existingSubmissions.filter(
      (submission) =>
        String(submission.teacherUserId) !== String(teacherUserId),
    );

    const updated = await this.institutionTasksRepo.update(taskId, {
      status: InstitutionTaskStatus.OPEN,
      submissions: [...filteredSubmissions, nextSubmission],
    });
    if (!updated) {
      throw new NotFoundException('Task not found.');
    }

    return updated;
  }

  private async getInstitutionContext(adminUserId: UserId) {
    const user = await this.usersService.findById(adminUserId);
    if (!user || user.roleId !== RoleId.INSTITUTION) {
      throw new ForbiddenException('Institution account required');
    }

    const school = await this.schoolsRepo.findByAdminUserId(adminUserId);
    if (!school) {
      throw new NotFoundException('Institution school not found');
    }

    return { user, school };
  }

  private withEffectiveTaskStatus(task: InstitutionTask): InstitutionTask {
    const normalizedStatus = this.getEffectiveTaskStatus(task);
    return {
      ...task,
      status: normalizedStatus,
    };
  }

  private getEffectiveTaskStatus(task: InstitutionTask): InstitutionTaskStatus {
    if (this.isTaskClosedByStoredStatus(task.status)) {
      return InstitutionTaskStatus.CLOSED;
    }

    if (this.isTaskPastDue(task)) {
      return InstitutionTaskStatus.CLOSED;
    }

    return InstitutionTaskStatus.OPEN;
  }

  private isTaskClosedByStoredStatus(status: InstitutionTaskStatus | string): boolean {
    return String(status) !== String(InstitutionTaskStatus.OPEN);
  }

  private isTaskPastDue(task: InstitutionTask): boolean {
    if (!task.dueDate) {
      return false;
    }

    const dueDateEnd = new Date(task.dueDate);
    dueDateEnd.setHours(23, 59, 59, 999);
    return Date.now() > dueDateEnd.getTime();
  }

  private async getSchoolTeachersBySchoolId(schoolId: string): Promise<User[]> {
    const users = await this.usersService.findAll();
    return users.filter(
      (user) =>
        user.roleId === RoleId.TEACHER &&
        String(user.schoolId) === String(schoolId),
    );
  }

  private async getTeacherInSchool(schoolId: string, teacherUserId: string) {
    const teacher = await this.usersService.findById(teacherUserId);
    if (
      !teacher ||
      teacher.roleId !== RoleId.TEACHER ||
      String(teacher.schoolId) !== String(schoolId)
    ) {
      throw new NotFoundException('Teacher not found in this institution');
    }

    return teacher;
  }

  private async assertTeachersBelongToSchool(
    schoolId: string,
    teacherUserIds: string[],
  ) {
    for (const teacherUserId of teacherUserIds) {
      await this.getTeacherInSchool(schoolId, teacherUserId);
    }
  }

  private async resolveTeacherUserIdsByEmails(
    schoolId: string,
    teacherEmails: string[],
  ): Promise<string[]> {
    const resolvedTeacherUserIds: string[] = [];

    for (const teacherEmail of teacherEmails.map((item) => item.trim()).filter(Boolean)) {
      const teacher = await this.usersService.findbyEmail(teacherEmail);
      if (
        !teacher ||
        teacher.roleId !== RoleId.TEACHER ||
        String(teacher.schoolId) !== String(schoolId)
      ) {
        throw new NotFoundException(
          `Teacher with email "${teacherEmail}" not found in this institution`,
        );
      }

      resolvedTeacherUserIds.push(String(teacher.userId));
    }

    return resolvedTeacherUserIds;
  }

  private async buildTeacherSummary(
    teacher: User,
    schoolId: string,
  ): Promise<TeacherSchoolSummary> {
    const [grade, offerings, subjects, plans] = await Promise.all([
      this.gradesRepo.findByTeacherId(teacher.userId),
      this.subjectOfferingsRepo.findAll(),
      this.subjectsRepo.findAll(),
      this.plansRepo.findAll(),
    ]);

    const teacherOfferings = offerings.filter(
      (item) =>
        String(item.teacherId) === String(teacher.userId) &&
        String(item.schoolId) === String(schoolId),
    );
    const subjectNames = teacherOfferings
      .map(
        (offering) =>
          subjects.find((item) => String(item.subjectId) === String(offering.subjectId))
            ?.subjectName ?? null,
      )
      .filter((item): item is string => Boolean(item));
    const teacherPlans = plans.filter(
      (plan) => String(plan.teacherId) === String(teacher.userId),
    );
    const latestPlan = teacherPlans
      .slice()
      .sort(
        (left, right) =>
          new Date(right.startDate).getTime() - new Date(left.startDate).getTime(),
      )[0];
    const latestActivityAt = await this.getLatestActivityForTeacherPlans(teacherPlans);
    const progress = latestPlan ? this.buildPlanProgressSummary(latestPlan) : null;
    const monitoring = latestPlan
      ? await this.plansService
          .getPlanProgress(teacher.userId, latestPlan.planId)
          .catch(() => null)
      : null;
    const canShowClassStats = teacher.isVerified;

    let studentCount: number | null = null;
    let classAverage: number | null = null;
    let weakStudentCount: number | null = null;

    if (canShowClassStats) {
      const [students, weakStudents, teacherClassAverage] = await Promise.all([
        this.studentsService.getStudents(teacher.userId).catch(() => []),
        this.statisticsService.getWeakStudentsForTeacher(teacher.userId).catch(() => []),
        this.statisticsService.classAverage(teacher.userId).catch(() => 0),
      ]);

      studentCount = students.length;
      classAverage = Math.round(teacherClassAverage);
      weakStudentCount = weakStudents.length;
    }

    return {
      userId: teacher.userId,
      fullName: teacher.fullName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber,
      isActive: teacher.isActive,
      isVerified: teacher.isVerified,
      grade: grade?.gradeName ?? null,
      section: grade?.gradeSection ?? null,
      subject: subjectNames.length ? subjectNames.join(', ') : null,
      studentCount,
      classAverage,
      weakStudentCount,
      hasGeneratedPlan: Boolean(latestPlan),
      progressPercentage: progress?.progressPercentage ?? null,
      classSpeedPercentage: monitoring?.classSpeedPercentage ?? null,
      behindPace: Boolean(
        monitoring?.reorderReasons?.includes('PROGRESS_BEHIND'),
      ),
      latestActivityAt,
    };
  }

  private async buildTeacherSubjectDetails(
    teacher: User,
    schoolId: string,
  ): Promise<TeacherSubjectDetailSummary[]> {
    const [offerings, subjects, plans, students] = await Promise.all([
      this.subjectOfferingsRepo.findAll(),
      this.subjectsRepo.findAll(),
      this.plansRepo.findAll(),
      teacher.isVerified
        ? this.studentsService.getStudents(teacher.userId).catch(() => [])
        : Promise.resolve([]),
    ]);

    const teacherOfferings = offerings.filter(
      (item) =>
        String(item.teacherId) === String(teacher.userId) &&
        String(item.schoolId) === String(schoolId),
    );

    const uniqueSubjectIds = [...new Set(teacherOfferings.map((item) => String(item.subjectId)))];

    const details = await Promise.all(
      uniqueSubjectIds.map(async (subjectId) => {
        const subjectName =
          subjects.find((item) => String(item.subjectId) === String(subjectId))
            ?.subjectName ?? subjectId;

        const teacherSubjectPlans = plans
          .filter(
            (plan) =>
              String(plan.teacherId) === String(teacher.userId) &&
              String(plan.subjectId) === String(subjectId),
          )
          .sort(
            (left, right) =>
              new Date(right.startDate).getTime() -
              new Date(left.startDate).getTime(),
          );

        const latestPlan = teacherSubjectPlans[0];
        const progress = latestPlan
          ? this.buildPlanProgressSummary(latestPlan)
          : null;
        const monitoring = latestPlan
          ? await this.plansService
              .getPlanProgress(teacher.userId, latestPlan.planId)
              .catch(() => null)
          : null;

        const studentCount = teacher.isVerified ? students.length : null;
        const classAverage = teacher.isVerified
          ? Math.round(
              await this.statisticsService
                .classAverage(teacher.userId, subjectId)
                .catch(() => 0),
            )
          : null;
        const weakStudentCount = teacher.isVerified
          ? (
              await this.statisticsService
                .getWeakStudentsForTeacher(teacher.userId, subjectId)
                .catch(() => [])
            ).length
          : null;

        return {
          subjectId,
          subjectName,
          studentCount,
          classAverage,
          weakStudentCount,
          hasGeneratedPlan: Boolean(latestPlan),
          progressPercentage: progress?.progressPercentage ?? null,
          classSpeedPercentage: monitoring?.classSpeedPercentage ?? null,
          behindPace: Boolean(
            monitoring?.reorderReasons?.includes('PROGRESS_BEHIND'),
          ),
        };
      }),
    );

    return details.sort((left, right) => {
      const leftRank = left.subjectName === 'Arabic' ? 0 : left.subjectName === 'Math' || left.subjectName === 'Mathematics' ? 1 : 2;
      const rightRank = right.subjectName === 'Arabic' ? 0 : right.subjectName === 'Math' || right.subjectName === 'Mathematics' ? 1 : 2;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.subjectName.localeCompare(right.subjectName);
    });
  }

  private async getLatestActivityForTeacherPlans(plans: { planId: string }[]) {
    if (plans.length === 0) return null;
    const planIds = new Set(plans.map((plan) => String(plan.planId)));
    const planLogs = (await this.planLogsRepo.findAll()).filter((item) =>
      planIds.has(String(item.planId)),
    );
    const latestLog = planLogs.sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    )[0];
    return latestLog?.createdAt ?? null;
  }

  private buildPlanProgressSummary(plan: any) {
    const items = (plan.sessions ?? []).flatMap((session) => session.items ?? []);
    const totalItems = items.length;
    const completedItems = items.filter((item) => item.status === 'Completed').length;
    const cancelledItems = items.filter((item) => item.status === 'Cancelled').length;
    const remainingItems = Math.max(0, totalItems - completedItems - cancelledItems);
    const progressPercentage =
      totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    return {
      totalItems,
      completedItems,
      remainingItems,
      cancelledItems,
      progressPercentage,
    };
  }

  private generateTeacherJoinCode(): string {
    return `SCH-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private getCurrentSchoolYear(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    return `${year}-${year + 1}`;
  }
}
