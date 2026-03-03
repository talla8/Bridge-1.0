import { Attendance } from 'src/domain/attendance';

export interface AttendanceRepository {
  upsert(attendance: Attendance): Promise<Attendance>;
  findById(id: string): Promise<Attendance | null>;
  findAll(): Promise<Attendance[]>;
  update(id: string, patch: Partial<Attendance>): Promise<Attendance | null>;
  delete(id: string): Promise<boolean>;
}
