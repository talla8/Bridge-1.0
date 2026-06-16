import { SubjectId, UserId } from 'src/domain/ids';
import { WeeklySlotDTO } from '../DTO/save-weekly-slots.dto';

export type SavedWeeklySlots = {
  teacherId: UserId;
  subjectId: SubjectId;
  slots: WeeklySlotDTO[];
};
