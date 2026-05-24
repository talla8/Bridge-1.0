import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Grade } from 'src/domain/grade';
import { UserId } from 'src/domain/ids';
import { SubjectOffering } from 'src/domain/subjectOffering';
import { RoleId, User } from 'src/domain/user';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';
import { InMemoryPlanLogsRepo } from 'src/infrastructure/in-memory/in-memory-planLog.repo';
import { InMemoryPlansRepo } from 'src/infrastructure/in-memory/in-memory-plan.repo';
import { InMemorySchoolsRepo } from 'src/infrastructure/in-memory/in-memory-school.repo';
import { InMemorySubjectOfferingsRepo } from 'src/infrastructure/in-memory/in-memory-subjectOffering.repo';
import { InMemorySubjectsRepo } from 'src/infrastructure/in-memory/in-memory-subject.repo';
import { StatisticsService } from 'src/statistics/statistics.service';
import { StudentsService } from 'src/students/students.service';
import { UsersService } from 'src/users/users.service';
import { CreateInstitutionNotificationDTO } from './DTO/create-notification.dto';
import { CreateInstitutionTaskDTO } from './DTO/create-task.dto';
import { CreateInstitutionTeacherDTO } from './DTO/create-teacher.dto';
import { InstitutionNotification } from './domain/institution-notification';
import { InstitutionTask, InstitutionTaskStatus } from './domain/institution-task';

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
  latestActivityAt: Date | null;
};

@Injectable()
export class InstitutionsService {
  private readonly notifications: InstitutionNotification[] = [];
  private readonly tasks: InstitutionTask[] = [];

  constructor(
    private readonly usersService: UsersService,
    private readonly schoolsRepo: InMemorySchoolsRepo,
    private readonly gradesRepo: InMemoryGradesRepo,
    private readonly subjectOfferingsRepo: InMemorySubjectOfferingsRepo,
    private readonly subjectsRepo: InMemorySubjectsRepo,
    private readonly studentsService: StudentsService,
    private readonly statisticsService: StatisticsService,
    private readonly plansRepo: InMemoryPlansRepo,
    private readonly planLogsRepo: InMemoryPlanLogsRepo,
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
      teachers.map((teacher) => this.buildTeacherSummary(teacher, school.schoolId)),
    );

    const activeTeachers = teacherSummaries.filter((teacher) => teacher.isActive).length;
    const teachersWithPlans = teacherSummaries.filter((teacher) => teacher.hasGeneratedPlan).length;
    const teachersWithoutPlans = teacherSummaries.length - teachersWithPlans;
    const behindPaceClasses = teacherSummaries.filter(
      (teacher) =>
        teacher.hasGeneratedPlan &&
        teacher.progressPercentage !== null &&
        teacher.progressPercentage < 100,
    ).length;

    const averageClassScore = teacherSummaries.length
      ? Math.round(
          teacherSummaries.reduce(
            (sum, teacher) => sum + (teacher.classAverage ?? 0),
            0,
          ) /
            teacherSummaries.length,
        )
      : 0;

    const weakStudents = teacherSummaries.reduce(
      (sum, teacher) => sum + (teacher.weakStudentCount ?? 0),
      0,
    );

    return {
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      totalTeachers: teacherSummaries.length,
      activeTeachers,
      teachersWithPlans,
      teachersWithoutPlans,
      averageClassScore,
      weakStudents,
      behindPaceClasses,
      recentNotifications: this.notifications
        .filter((item) => String(item.schoolId) === String(school.schoolId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      openTasks: this.tasks
        .filter(
          (item) =>
            String(item.schoolId) === String(school.schoolId) &&
            item.status === InstitutionTaskStatus.OPEN,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      teachers: teacherSummaries,
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
    const teacherPlans = (await this.plansRepo.findAll()).filter(
      (plan) => String(plan.teacherId) === String(teacher.userId),
    );
    const teacherPlanIds = new Set(teacherPlans.map((plan) => String(plan.planId)));
    const activity = (await this.planLogsRepo.findAll())
      .filter((item) => teacherPlanIds.has(String(item.planId)))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const notifications = this.notifications.filter(
      (item) =>
        String(item.schoolId) === String(school.schoolId) &&
        (!item.recipientTeacherUserIds?.length ||
          item.recipientTeacherUserIds.some(
            (candidate) => String(candidate) === String(teacherUserId),
          )),
    );

    const tasks = this.tasks.filter(
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
      notifications,
      tasks,
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
    return this.notifications
      .filter((item) => String(item.schoolId) === String(school.schoolId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(
    adminUserId: UserId,
    dto: CreateInstitutionNotificationDTO,
  ) {
    const { school } = await this.getInstitutionContext(adminUserId);
    await this.assertTeachersBelongToSchool(school.schoolId, dto.recipientTeacherUserIds ?? []);

    const notification: InstitutionNotification = {
      notificationId: `notification_${randomUUID()}`,
      schoolId: school.schoolId,
      createdByUserId: adminUserId,
      title: dto.title.trim(),
      message: dto.message.trim(),
      recipientTeacherUserIds: dto.recipientTeacherUserIds?.map(String) ?? [],
      createdAt: new Date(),
    };
    this.notifications.push(notification);
    return notification;
  }

  async getTasks(adminUserId: UserId) {
    const { school } = await this.getInstitutionContext(adminUserId);
    return this.tasks
      .filter((item) => String(item.schoolId) === String(school.schoolId))
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
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: InstitutionTaskStatus.OPEN,
      createdAt: new Date(),
    };
    this.tasks.push(task);
    return task;
  }

  async getTeacherNotifications(teacherUserId: UserId) {
    const teacher = await this.usersService.findById(teacherUserId);
    if (!teacher || teacher.roleId !== RoleId.TEACHER || !teacher.schoolId) {
      throw new ForbiddenException('Teacher institution inbox is unavailable');
    }

    return this.notifications
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

    return this.tasks
      .filter(
        (item) =>
          String(item.schoolId) === String(teacher.schoolId) &&
          item.assignedTeacherUserIds.some(
            (candidate) => String(candidate) === String(teacherUserId),
          ),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      latestActivityAt,
    };
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
