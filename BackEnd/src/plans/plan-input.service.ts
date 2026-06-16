import { BadRequestException, Injectable } from '@nestjs/common';
import { SqliteGradesRepo } from 'src/database/sqlite-grade.repo';
import { SqliteSubjectOfferingsRepo } from 'src/database/sqlite-subject-offering.repo';
import { SqliteWeeklySlotsRepo } from 'src/database/sqlite-weekly-slots.repo';
import { SubjectId, UserId } from 'src/domain/ids';
import {
  SaveWeeklySlotsDTO,
  WeekDay,
  WeeklySlotDTO,
} from './DTO/save-weekly-slots.dto';
import { SavedWeeklySlots } from './types/saved-weekly-slots';

@Injectable()
export class PlanInputService {
  constructor(
    private readonly gradesRepo: SqliteGradesRepo,
    private readonly subjectOfferingsRepo: SqliteSubjectOfferingsRepo,
    private readonly weeklySlotsRepo: SqliteWeeklySlotsRepo,
  ) {}

  private readonly allowedDays: WeekDay[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
  ];

  private getMinimumWeeklySlots(subjectId: SubjectId): number {
    if (String(subjectId) === '2') {
      return 7;
    }

    if (String(subjectId) === '1') {
      return 5;
    }

    return 1;
  }

  async saveWeeklySlots(
    teacherId: UserId,
    saveWeeklySlotsDto: SaveWeeklySlotsDTO,
  ): Promise<SavedWeeklySlots> {
    if (!saveWeeklySlotsDto.subjectId) {
      throw new BadRequestException('Subject is required');
    }

    if (!saveWeeklySlotsDto.slots.length) {
      throw new BadRequestException('At least one weekly slot is required');
    }

    const minimumWeeklySlots = this.getMinimumWeeklySlots(
      saveWeeklySlotsDto.subjectId,
    );
    if (saveWeeklySlotsDto.slots.length < minimumWeeklySlots) {
      throw new BadRequestException(
        `Minimum weekly slots for this subject is ${minimumWeeklySlots}.`,
      );
    }

    this.ensureValidSlots(saveWeeklySlotsDto.slots);
    return this.saveAndEnsureSubjectOffering(teacherId, saveWeeklySlotsDto);
  }

  private async saveAndEnsureSubjectOffering(
    teacherId: UserId,
    saveWeeklySlotsDto: SaveWeeklySlotsDTO,
  ): Promise<SavedWeeklySlots> {
    await this.ensureSubjectOffering(teacherId, saveWeeklySlotsDto.subjectId);

    const savedEntry: SavedWeeklySlots = {
      teacherId,
      subjectId: saveWeeklySlotsDto.subjectId,
      slots: saveWeeklySlotsDto.slots,
    };

    return this.weeklySlotsRepo.upsert(savedEntry);
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

  async getWeeklySlots(
    teacherId: UserId,
    subjectId: SubjectId,
  ): Promise<SavedWeeklySlots | null> {
    return this.weeklySlotsRepo.findByTeacherAndSubject(teacherId, subjectId);
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
