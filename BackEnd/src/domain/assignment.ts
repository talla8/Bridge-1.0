import { AssignmentId, StudentId, SubjectId, UserId } from './ids';

export enum AssignmentType {
  HOMEWORK = 'HOMEWORK',
  QUIZ = 'QUIZ',
  PRACTICE = 'PRACTICE',
}

export enum AssignmentSourceType {
  CURRICULUM_ITEM = 'CURRICULUM_ITEM',
  SUPPORT_PROGRAM_ITEM = 'SUPPORT_PROGRAM_ITEM',
  TEACHER_CREATED = 'TEACHER_CREATED',
}

export enum AssignmentTargetType {
  WHOLE_CLASS = 'WHOLE_CLASS',
  SELECTED_STUDENTS = 'SELECTED_STUDENTS',
  WEAK_STUDENTS = 'WEAK_STUDENTS',
}

export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export class Assignment {
  assignmentId: AssignmentId;
  teacherId: UserId;
  subjectId: SubjectId;
  title: string;
  type: AssignmentType;
  sourceType: AssignmentSourceType;
  sourceId: string;
  targetType: AssignmentTargetType;
  targetStudentIds: StudentId[];
  createdAt: Date;
  dueDate?: Date;
  status: AssignmentStatus;
}
