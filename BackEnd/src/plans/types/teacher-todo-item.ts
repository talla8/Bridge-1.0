import { PlanItem } from 'src/domain/plan-item';

export type TeacherTodoItem = {
  planId: string;
  planName: string;
  subjectId: string;
  sessionId: string;
  sessionDate: Date;
  sessionWeekNo: number;
  day: string;
  slotNumber: number;
  item: PlanItem;
};
