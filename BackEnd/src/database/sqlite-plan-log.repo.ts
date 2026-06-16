import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanLog } from 'src/domain/planLog';
import { PlanLogRepository } from 'src/repositories/planLog.repository';
import { PlanLogEntity } from './entities/plan-log.entity';

@Injectable()
export class SqlitePlanLogsRepo implements PlanLogRepository {
  constructor(
    @InjectRepository(PlanLogEntity)
    private readonly repository: Repository<PlanLogEntity>,
  ) {}

  async create(planLog: PlanLog): Promise<PlanLog> {
    const entity = this.repository.create(this.toEntity(planLog));
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<PlanLog | null> {
    const entity = await this.repository.findOneBy({ planLogId: String(id) });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<PlanLog[]> {
    const entities = await this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByPlanId(planId: string): Promise<PlanLog[]> {
    const entities = await this.repository.find({
      where: { planId: String(planId) },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async update(id: string, patch: Partial<PlanLog>): Promise<PlanLog | null> {
    const existing = await this.repository.findOneBy({ planLogId: String(id) });
    if (!existing) return null;

    const merged = this.repository.merge(
      existing,
      this.toEntityPatch(patch) as Partial<PlanLogEntity>,
    );
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ planLogId: String(id) });
    return true;
  }

  private toEntity(planLog: PlanLog): PlanLogEntity {
    return {
      planLogId: String(planLog.planLogId),
      planId: String(planLog.planId),
      sessionId:
        planLog.sessionId === undefined || planLog.sessionId === null
          ? undefined
          : String(planLog.sessionId),
      planItemId:
        planLog.planItemId === undefined || planLog.planItemId === null
          ? undefined
          : String(planLog.planItemId),
      curriculumItemId:
        planLog.curriculumItemId === undefined ||
        planLog.curriculumItemId === null
          ? undefined
          : String(planLog.curriculumItemId),
      actionType: planLog.actionType,
      description: String(planLog.description),
      createdAt: new Date(planLog.createdAt),
      metadataJson:
        planLog.metadata === undefined
          ? null
          : JSON.stringify(planLog.metadata),
    };
  }

  private toEntityPatch(patch: Partial<PlanLog>): Partial<PlanLogEntity> {
    return {
      ...patch,
      planId:
        patch.planId === undefined || patch.planId === null
          ? patch.planId
          : String(patch.planId),
      sessionId:
        patch.sessionId === undefined || patch.sessionId === null
          ? patch.sessionId
          : String(patch.sessionId),
      planItemId:
        patch.planItemId === undefined || patch.planItemId === null
          ? patch.planItemId
          : String(patch.planItemId),
      curriculumItemId:
        patch.curriculumItemId === undefined ||
        patch.curriculumItemId === null
          ? patch.curriculumItemId
          : String(patch.curriculumItemId),
      description:
        patch.description === undefined
          ? patch.description
          : String(patch.description),
      createdAt:
        patch.createdAt === undefined || patch.createdAt === null
          ? patch.createdAt
          : new Date(patch.createdAt),
      metadataJson:
        patch.metadata === undefined ? undefined : JSON.stringify(patch.metadata),
    };
  }

  private toDomain(entity: PlanLogEntity): PlanLog {
    return {
      planLogId: String(entity.planLogId),
      planId: String(entity.planId),
      sessionId:
        entity.sessionId === undefined || entity.sessionId === null
          ? undefined
          : String(entity.sessionId),
      planItemId:
        entity.planItemId === undefined || entity.planItemId === null
          ? undefined
          : String(entity.planItemId),
      curriculumItemId:
        entity.curriculumItemId === undefined ||
        entity.curriculumItemId === null
          ? undefined
          : String(entity.curriculumItemId),
      actionType: entity.actionType,
      description: entity.description,
      createdAt: new Date(entity.createdAt),
      metadata:
        entity.metadataJson === undefined ||
        entity.metadataJson === null ||
        entity.metadataJson === ''
          ? undefined
          : (JSON.parse(entity.metadataJson) as Record<string, unknown>),
    };
  }
}
