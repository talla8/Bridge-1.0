import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SqliteAssignmentsRepo } from 'src/database/sqlite-assignment.repo';
import {
  Assignment,
  AssignmentStatus,
  AssignmentTargetType,
} from 'src/domain/assignment';
import { StudentId, UserId } from 'src/domain/ids';
import { StatisticsService } from 'src/statistics/statistics.service';
import { StudentsService } from 'src/students/students.service';
import { PublishAssignmentDTO } from './DTO/publish-assignment.dto';

export type AssignmentPublishSummary = {
  assignmentId: string;
  type: Assignment['type'];
  targetType: AssignmentTargetType;
  targetStudentCount: number;
  status: AssignmentStatus;
  createdAt: Date;
};

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly assignmentsRepo: SqliteAssignmentsRepo,
    private readonly studentsService: StudentsService,
    private readonly statisticsService: StatisticsService,
  ) {}

  async publishAssignment(
    teacherId: UserId,
    dto: PublishAssignmentDTO,
  ): Promise<AssignmentPublishSummary> {
    const targetStudentIds = await this.resolveTargetStudents(teacherId, dto);
    const assignment: Assignment = {
      assignmentId: `assignment_${randomUUID()}`,
      teacherId,
      subjectId: dto.subjectId,
      title: dto.title,
      type: dto.type,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      targetType: dto.targetType,
      targetStudentIds,
      createdAt: new Date(),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: AssignmentStatus.PUBLISHED,
    };

    const savedAssignment = await this.assignmentsRepo.create(assignment);
    return this.toPublishSummary(savedAssignment);
  }

  async getTeacherAssignments(teacherId: UserId): Promise<Assignment[]> {
    return this.assignmentsRepo.findByTeacherId(teacherId);
  }

  async getAssignmentById(
    teacherId: UserId,
    assignmentId: string,
  ): Promise<Assignment> {
    const assignment = await this.assignmentsRepo.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    if (String(assignment.teacherId) !== String(teacherId)) {
      throw new ForbiddenException('Teacher does not own this assignment.');
    }

    return assignment;
  }

  private async resolveTargetStudents(
    teacherId: UserId,
    dto: PublishAssignmentDTO,
  ): Promise<StudentId[]> {
    const teacherStudents = await this.studentsService.getStudents(teacherId);
    const teacherStudentIds = new Set(
      teacherStudents.map((student) => student.studentId),
    );

    if (dto.targetType === AssignmentTargetType.WHOLE_CLASS) {
      return [...teacherStudentIds];
    }

    if (dto.targetType === AssignmentTargetType.WEAK_STUDENTS) {
      const weakStudents =
        await this.statisticsService.getWeakStudentsForTeacher(teacherId);
      return weakStudents.map((student) => student.studentId);
    }

    if (dto.targetType === AssignmentTargetType.SELECTED_STUDENTS) {
      if (!dto.targetStudentIds?.length) {
        throw new BadRequestException(
          'targetStudentIds is required for selected students.',
        );
      }

      const invalidStudentId = dto.targetStudentIds.find(
        (studentId) => !teacherStudentIds.has(studentId),
      );
      if (invalidStudentId) {
        throw new BadRequestException(
          `Student ${invalidStudentId} does not belong to this teacher.`,
        );
      }

      return [...new Set(dto.targetStudentIds)];
    }

    throw new BadRequestException('Unsupported assignment target type.');
  }

  private toPublishSummary(assignment: Assignment): AssignmentPublishSummary {
    return {
      assignmentId: assignment.assignmentId,
      type: assignment.type,
      targetType: assignment.targetType,
      targetStudentCount: assignment.targetStudentIds.length,
      status: assignment.status,
      createdAt: assignment.createdAt,
    };
  }
}
