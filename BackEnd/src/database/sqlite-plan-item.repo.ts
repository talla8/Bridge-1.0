import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanItem } from 'src/domain/plan-item';
import { PlanItemRepository } from 'src/repositories/plan-item.repository';
import { PlanItemEntity } from './entities/plan-item.entity';

@Injectable()
export class SqlitePlanItemsRepo implements PlanItemRepository {
  constructor(
    @InjectRepository(PlanItemEntity)
    private readonly repository: Repository<PlanItemEntity>,
  ) {}

  async create(planItem: PlanItem): Promise<PlanItem> {
    const entity = this.repository.create(this.normalizePlanItem(planItem));
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<PlanItem | null> {
    return this.repository.findOneBy({ planItemId: String(id) });
  }

  async findAll(): Promise<PlanItem[]> {
    return this.repository.find({
      order: {
        planItemId: 'ASC',
      },
    });
  }

  async update(id: string, patch: Partial<PlanItem>): Promise<PlanItem | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = this.repository.merge(
      this.repository.create(existing),
      this.normalizePlanItemPatch(patch) as Partial<PlanItemEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ planItemId: String(id) });
    return true;
  }

  private normalizePlanItem(planItem: PlanItem): PlanItem {
    return {
      ...planItem,
      planItemId: String(planItem.planItemId),
      planId: String(planItem.planId),
      sessionId: String(planItem.sessionId),
      curriculumItemId: String(planItem.curriculumItemId),
      subjectId: String(planItem.subjectId),
      title: String(planItem.title),
      unitNo: Number(planItem.unitNo),
      lessonNo: Number(planItem.lessonNo),
      orderInLesson: Number(planItem.orderInLesson),
      estimatedTime: Number(planItem.estimatedTime),
      originalEstimatedTime:
        planItem.originalEstimatedTime === undefined ||
        planItem.originalEstimatedTime === null
          ? undefined
          : Number(planItem.originalEstimatedTime),
      minEstimatedTime:
        planItem.minEstimatedTime === undefined ||
        planItem.minEstimatedTime === null
          ? undefined
          : Number(planItem.minEstimatedTime),
      originalSessionOrder:
        planItem.originalSessionOrder === undefined ||
        planItem.originalSessionOrder === null
          ? undefined
          : Number(planItem.originalSessionOrder),
      carriedForwardCount:
        planItem.carriedForwardCount === undefined ||
        planItem.carriedForwardCount === null
          ? undefined
          : Number(planItem.carriedForwardCount),
      notes:
        planItem.notes === undefined || planItem.notes === null
          ? undefined
          : String(planItem.notes),
    };
  }

  private normalizePlanItemPatch(
    patch: Partial<PlanItem>,
  ): Partial<PlanItem> {
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
      curriculumItemId:
        patch.curriculumItemId === undefined || patch.curriculumItemId === null
          ? patch.curriculumItemId
          : String(patch.curriculumItemId),
      subjectId:
        patch.subjectId === undefined || patch.subjectId === null
          ? patch.subjectId
          : String(patch.subjectId),
      title: patch.title === undefined ? patch.title : String(patch.title),
      unitNo:
        patch.unitNo === undefined || patch.unitNo === null
          ? patch.unitNo
          : Number(patch.unitNo),
      lessonNo:
        patch.lessonNo === undefined || patch.lessonNo === null
          ? patch.lessonNo
          : Number(patch.lessonNo),
      orderInLesson:
        patch.orderInLesson === undefined || patch.orderInLesson === null
          ? patch.orderInLesson
          : Number(patch.orderInLesson),
      estimatedTime:
        patch.estimatedTime === undefined || patch.estimatedTime === null
          ? patch.estimatedTime
          : Number(patch.estimatedTime),
      originalEstimatedTime:
        patch.originalEstimatedTime === undefined ||
        patch.originalEstimatedTime === null
          ? patch.originalEstimatedTime
          : Number(patch.originalEstimatedTime),
      minEstimatedTime:
        patch.minEstimatedTime === undefined || patch.minEstimatedTime === null
          ? patch.minEstimatedTime
          : Number(patch.minEstimatedTime),
      originalSessionOrder:
        patch.originalSessionOrder === undefined ||
        patch.originalSessionOrder === null
          ? patch.originalSessionOrder
          : Number(patch.originalSessionOrder),
      carriedForwardCount:
        patch.carriedForwardCount === undefined ||
        patch.carriedForwardCount === null
          ? patch.carriedForwardCount
          : Number(patch.carriedForwardCount),
      notes:
        patch.notes === undefined || patch.notes === null
          ? patch.notes
          : String(patch.notes),
    };
  }
}
