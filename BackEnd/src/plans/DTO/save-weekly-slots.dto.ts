import { SubjectId } from 'src/domain/ids';

export type WeekDay =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday';

export class WeeklySlotDTO {
  day: WeekDay;
  slotNumber: number;
}

export class SaveWeeklySlotsDTO {
  subjectId: SubjectId;
  slots: WeeklySlotDTO[];
}
