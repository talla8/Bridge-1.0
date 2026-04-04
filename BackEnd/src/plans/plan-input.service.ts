import { BadRequestException, Injectable } from '@nestjs/common';
import { SubjectId, UserId } from 'src/domain/ids';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';
import { InMemorySubjectOfferingsRepo } from 'src/infrastructure/in-memory/in-memory-subjectOffering.repo';
import {
  SaveWeeklySlotsDTO,
  WeekDay,
  WeeklySlotDTO,
} from './DTO/save-weekly-slots.dto';

export type SavedWeeklySlots = {
  teacherId: UserId;
  subjectId: SubjectId;
  slots: WeeklySlotDTO[];
};

@Injectable()
export class PlanInputService {
  constructor(
    private readonly gradesRepo: InMemoryGradesRepo,
    private readonly subjectOfferingsRepo: InMemorySubjectOfferingsRepo,
  ) {}

  private readonly weeklySlotsStore: SavedWeeklySlots[] = [];
  private readonly allowedDays: WeekDay[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
  ];

  saveWeeklySlots(
    teacherId: UserId,
    saveWeeklySlotsDto: SaveWeeklySlotsDTO,
  ): Promise<SavedWeeklySlots> {
    if (!saveWeeklySlotsDto.subjectId) {
      throw new BadRequestException('Subject is required');
    }

    if (!saveWeeklySlotsDto.slots.length) {
      throw new BadRequestException('At least one weekly slot is required');
    }

    this.ensureValidSlots(saveWeeklySlotsDto.slots);
    return this.saveAndEnsureSubjectOffering(teacherId, saveWeeklySlotsDto);
  }

  private async saveAndEnsureSubjectOffering(
    teacherId: UserId,
    saveWeeklySlotsDto: SaveWeeklySlotsDTO,
  ): Promise<SavedWeeklySlots> {
    await this.ensureSubjectOffering(teacherId, saveWeeklySlotsDto.subjectId);

    const existingIndex = this.weeklySlotsStore.findIndex(
      (entry) =>
        entry.teacherId === teacherId &&
        entry.subjectId === saveWeeklySlotsDto.subjectId,
    );

    const savedEntry: SavedWeeklySlots = {
      teacherId,
      subjectId: saveWeeklySlotsDto.subjectId,
      slots: saveWeeklySlotsDto.slots,
    };

    if (existingIndex === -1) {
      this.weeklySlotsStore.push(savedEntry);
    } else {
      this.weeklySlotsStore[existingIndex] = savedEntry;
    }

    return savedEntry;
  }

  private async ensureSubjectOffering(
    teacherId: UserId,
    subjectId: SubjectId,
  ): Promise<void> {
    const existingOfferings = await this.subjectOfferingsRepo.findAll();
    const existingOffering = existingOfferings.find(
      (offering) =>
        String(offering.teacherId) === String(teacherId) &&
        String(offering.subjectId) === String(subjectId),
    );

    if (existingOffering) {
      return;
    }

    const grade = await this.gradesRepo.findByTeacherId(teacherId);
    if (!grade) {
      throw new BadRequestException(
        'Teacher grade information is missing. Complete teacher setup first.',
      );
    }

    await this.subjectOfferingsRepo.create({
      subjectOfferingId: `subject_offering_${teacherId}_${subjectId}`,
      subjectId,
      gradeId: grade.gradeId,
      teacherId,
      schoolId: '1',
      schoolYear: this.getCurrentSchoolYear(),
    });
  }

  private getCurrentSchoolYear(): string {
    const now = new Date();
    const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return `${startYear}-${startYear + 1}`;
  }

  getWeeklySlots(
    teacherId: UserId,
    subjectId: SubjectId,
  ): SavedWeeklySlots | null {
    return (
      this.weeklySlotsStore.find(
        (entry) =>
          entry.teacherId === teacherId && entry.subjectId === subjectId,
      ) ?? null
    );
  }

  private ensureValidSlots(slots: WeeklySlotDTO[]): void {
    const seen = new Set<string>();

    for (const slot of slots) {
      if (!this.allowedDays.includes(slot.day)) {
        throw new BadRequestException(`Invalid day: ${slot.day}`);
      }

      if (!Number.isInteger(slot.slotNumber) || slot.slotNumber <= 0) {
        throw new BadRequestException('Slot number must be a positive integer');
      }

      const key = `${slot.day}-${slot.slotNumber}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `Duplicate weekly slot detected for ${slot.day} slot ${slot.slotNumber}`,
        );
      }

      seen.add(key);
    }
  }
}
