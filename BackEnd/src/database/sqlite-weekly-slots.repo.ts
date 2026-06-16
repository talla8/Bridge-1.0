import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubjectId, UserId } from 'src/domain/ids';
import { WeeklySlotDTO } from 'src/plans/DTO/save-weekly-slots.dto';
import { SavedWeeklySlots } from 'src/plans/types/saved-weekly-slots';
import { WeeklySlotsEntity } from './entities/weekly-slots.entity';

@Injectable()
export class SqliteWeeklySlotsRepo {
  constructor(
    @InjectRepository(WeeklySlotsEntity)
    private readonly repository: Repository<WeeklySlotsEntity>,
  ) {}

  async upsert(entry: SavedWeeklySlots): Promise<SavedWeeklySlots> {
    const normalizedEntry = this.normalizeSavedWeeklySlots(entry);
    const entity = this.repository.create({
      teacherId: normalizedEntry.teacherId,
      subjectId: normalizedEntry.subjectId,
      slotsJson: JSON.stringify(normalizedEntry.slots),
    });

    await this.repository.save(entity);
    return normalizedEntry;
  }

  async findByTeacherAndSubject(
    teacherId: UserId,
    subjectId: SubjectId,
  ): Promise<SavedWeeklySlots | null> {
    const entity = await this.repository.findOneBy({
      teacherId: String(teacherId),
      subjectId: String(subjectId),
    });

    return entity ? this.mapEntity(entity) : null;
  }

  private mapEntity(entity: WeeklySlotsEntity): SavedWeeklySlots {
    return {
      teacherId: String(entity.teacherId),
      subjectId: String(entity.subjectId),
      slots: this.parseSlots(entity.slotsJson),
    };
  }

  private normalizeSavedWeeklySlots(entry: SavedWeeklySlots): SavedWeeklySlots {
    return {
      teacherId: String(entry.teacherId),
      subjectId: String(entry.subjectId),
      slots: entry.slots.map((slot) => ({
        day: slot.day,
        slotNumber: Number(slot.slotNumber),
      })),
    };
  }

  private parseSlots(slotsJson: string): WeeklySlotDTO[] {
    const parsed = JSON.parse(slotsJson) as WeeklySlotDTO[];
    return Array.isArray(parsed)
      ? parsed.map((slot) => ({
          day: slot.day,
          slotNumber: Number(slot.slotNumber),
        }))
      : [];
  }
}
