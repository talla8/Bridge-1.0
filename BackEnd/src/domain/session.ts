import { PlanItem } from './plan-item';

export class Session {
  sessionId: string;
  teacherId: string;
  subjectId: string;
  day: string;
  items: PlanItem[];
  maxDuration: number; //later we get it from the teacher
  usedDuration: number;
  reviewBufferMinutes: number;
  slotNumber: number;
  sessionDate: Date;
  sessionWeekNo: number;
}
