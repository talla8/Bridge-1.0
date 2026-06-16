import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanItem } from 'src/domain/plan-item';
import { Session } from 'src/domain/session';
import { SessionRepository } from 'src/repositories/session.repository';
import { SessionEntity } from './entities/session.entity';

@Injectable()
export class SqliteSessionsRepo implements SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repository: Repository<SessionEntity>,
  ) {}

  async create(session: Session): Promise<Session> {
    const entity = this.repository.create(this.toEntity(session));
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Session | null> {
    const entity = await this.repository.findOneBy({ sessionId: String(id) });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Session[]> {
    const entities = await this.repository.find({
      order: {
        sessionDate: 'ASC',
        slotNumber: 'ASC',
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async update(id: string, patch: Partial<Session>): Promise<Session | null> {
    const existing = await this.repository.findOneBy({ sessionId: String(id) });
    if (!existing) return null;

    const merged = this.repository.merge(
      existing,
      this.toEntityPatch(patch) as Partial<SessionEntity>,
    );
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ sessionId: String(id) });
    return true;
  }

  private toEntity(session: Session): SessionEntity {
    return {
      sessionId: String(session.sessionId),
      teacherId: String(session.teacherId),
      subjectId: String(session.subjectId),
      day: String(session.day),
      itemsJson: JSON.stringify(session.items ?? []),
      maxDuration: Number(session.maxDuration),
      usedDuration: Number(session.usedDuration),
      reviewBufferMinutes: Number(session.reviewBufferMinutes),
      slotNumber: Number(session.slotNumber),
      sessionDate: new Date(session.sessionDate),
      sessionWeekNo: Number(session.sessionWeekNo),
    };
  }

  private toEntityPatch(patch: Partial<Session>): Partial<SessionEntity> {
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
      day: patch.day === undefined ? patch.day : String(patch.day),
      itemsJson:
        patch.items === undefined ? undefined : JSON.stringify(patch.items),
      maxDuration:
        patch.maxDuration === undefined || patch.maxDuration === null
          ? patch.maxDuration
          : Number(patch.maxDuration),
      usedDuration:
        patch.usedDuration === undefined || patch.usedDuration === null
          ? patch.usedDuration
          : Number(patch.usedDuration),
      reviewBufferMinutes:
        patch.reviewBufferMinutes === undefined ||
        patch.reviewBufferMinutes === null
          ? patch.reviewBufferMinutes
          : Number(patch.reviewBufferMinutes),
      slotNumber:
        patch.slotNumber === undefined || patch.slotNumber === null
          ? patch.slotNumber
          : Number(patch.slotNumber),
      sessionDate:
        patch.sessionDate === undefined || patch.sessionDate === null
          ? patch.sessionDate
          : new Date(patch.sessionDate),
      sessionWeekNo:
        patch.sessionWeekNo === undefined || patch.sessionWeekNo === null
          ? patch.sessionWeekNo
          : Number(patch.sessionWeekNo),
    };
  }

  private toDomain(entity: SessionEntity): Session {
    return {
      sessionId: String(entity.sessionId),
      teacherId: String(entity.teacherId),
      subjectId: String(entity.subjectId),
      day: entity.day,
      items: this.parseItems(entity.itemsJson),
      maxDuration: Number(entity.maxDuration),
      usedDuration: Number(entity.usedDuration),
      reviewBufferMinutes: Number(entity.reviewBufferMinutes),
      slotNumber: Number(entity.slotNumber),
      sessionDate: new Date(entity.sessionDate),
      sessionWeekNo: Number(entity.sessionWeekNo),
    };
  }

  private parseItems(itemsJson: string): PlanItem[] {
    const parsed = JSON.parse(itemsJson) as PlanItem[];
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          ...item,
          planItemId: String(item.planItemId),
          planId: String(item.planId),
          sessionId: String(item.sessionId),
          curriculumItemId: String(item.curriculumItemId),
          subjectId: String(item.subjectId),
          estimatedTime: Number(item.estimatedTime),
          unitNo: Number(item.unitNo),
          lessonNo: Number(item.lessonNo),
          orderInLesson: Number(item.orderInLesson),
        }))
      : [];
  }
}
