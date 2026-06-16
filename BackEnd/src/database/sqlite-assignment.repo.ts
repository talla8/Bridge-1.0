import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from 'src/domain/assignment';
import { AssignmentRepository } from 'src/repositories/assignment.repository';
import { AssignmentEntity } from './entities/assignment.entity';

@Injectable()
export class SqliteAssignmentsRepo implements AssignmentRepository {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly repository: Repository<AssignmentEntity>,
  ) {}

  async create(assignment: Assignment): Promise<Assignment> {
    const entity = this.repository.create(this.toEntity(assignment));
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Assignment | null> {
    const entity = await this.repository.findOneBy({ assignmentId: String(id) });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Assignment[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByTeacherId(teacherId: string): Promise<Assignment[]> {
    const entities = await this.repository.find({
      where: { teacherId: String(teacherId) },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByStudentId(studentId: string): Promise<Assignment[]> {
    const assignments = await this.findAll();
    return assignments.filter((assignment) =>
      assignment.targetStudentIds.includes(String(studentId)),
    );
  }

  async update(
    id: string,
    patch: Partial<Assignment>,
  ): Promise<Assignment | null> {
    const existing = await this.repository.findOneBy({ assignmentId: String(id) });
    if (!existing) return null;

    const merged = this.repository.merge(
      existing,
      this.toEntityPatch(patch) as Partial<AssignmentEntity>,
    );
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ assignmentId: String(id) });
    return true;
  }

  private toEntity(assignment: Assignment): AssignmentEntity {
    return {
      assignmentId: String(assignment.assignmentId),
      teacherId: String(assignment.teacherId),
      subjectId: String(assignment.subjectId),
      title: String(assignment.title),
      type: assignment.type,
      sourceType: assignment.sourceType,
      sourceId: String(assignment.sourceId),
      targetType: assignment.targetType,
      targetStudentIdsJson: JSON.stringify(assignment.targetStudentIds ?? []),
      createdAt: new Date(assignment.createdAt),
      dueDate:
        assignment.dueDate === undefined || assignment.dueDate === null
          ? undefined
          : new Date(assignment.dueDate),
      status: assignment.status,
    };
  }

  private toEntityPatch(patch: Partial<Assignment>): Partial<AssignmentEntity> {
    return {
      ...patch,
      teacherId:
        patch.teacherId === undefined || patch.teacherId === null
          ? patch.teacherId
          : String(patch.teacherId),
      subjectId:
        patch.subjectId === undefined || patch.subjectId === null
          ? patch.subjectId
          : String(patch.subjectId),
      title: patch.title === undefined ? patch.title : String(patch.title),
      sourceId:
        patch.sourceId === undefined || patch.sourceId === null
          ? patch.sourceId
          : String(patch.sourceId),
      targetStudentIdsJson:
        patch.targetStudentIds === undefined
          ? undefined
          : JSON.stringify(patch.targetStudentIds),
      createdAt:
        patch.createdAt === undefined || patch.createdAt === null
          ? patch.createdAt
          : new Date(patch.createdAt),
      dueDate:
        patch.dueDate === undefined || patch.dueDate === null
          ? patch.dueDate
          : new Date(patch.dueDate),
    };
  }

  private toDomain(entity: AssignmentEntity): Assignment {
    return {
      assignmentId: String(entity.assignmentId),
      teacherId: String(entity.teacherId),
      subjectId: String(entity.subjectId),
      title: entity.title,
      type: entity.type,
      sourceType: entity.sourceType,
      sourceId: String(entity.sourceId),
      targetType: entity.targetType,
      targetStudentIds: this.parseStudentIds(entity.targetStudentIdsJson),
      createdAt: new Date(entity.createdAt),
      dueDate:
        entity.dueDate === undefined || entity.dueDate === null
          ? undefined
          : new Date(entity.dueDate),
      status: entity.status,
    };
  }

  private parseStudentIds(targetStudentIdsJson: string): string[] {
    const parsed = JSON.parse(targetStudentIdsJson) as string[];
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  }
}
