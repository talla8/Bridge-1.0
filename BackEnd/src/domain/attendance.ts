import { AttendanceId, GradeId, StudentId } from './ids';

export class Attendance {
  attendanceId: AttendanceId;
  gradeId: GradeId;
  studentId: StudentId;
  atDate: Date;
  status: string;
}
