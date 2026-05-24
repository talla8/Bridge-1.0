import { SchoolId } from './ids';
import { UserId } from './ids';

export class School {
  schoolId: SchoolId;
  schoolName: string;
  adminUserId?: UserId;
  teacherJoinCode?: string;
  teacherSelfRegistrationEnabled?: boolean;
}
