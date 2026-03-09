import { Injectable } from '@nestjs/common';
import { Attendance } from 'src/domain/attendance';
import { AttendanceRepository } from 'src/repositories/attendance.repository';

@Injectable()
export class InMemoryAttendancesRepo implements AttendanceRepository {
  private attendances: Attendance[] = [];

  async upsert(attendance: Attendance): Promise<Attendance> {
    const index = this.attendances.findIndex(
      (item: Attendance): boolean => item.attendanceId === attendance.attendanceId,
    );

    if (index === -1) {
      this.attendances.push(attendance);
      return attendance;
    }

    this.attendances[index] = attendance;
    return attendance;
  }

  async findById(id: string): Promise<Attendance | null> {
    return (
      this.attendances.find((attendance: Attendance): boolean => attendance.attendanceId === id) ??
      null
    );
  }

  async findByStudentId(id: string): Promise<Attendance | null> {
    return this.attendances.find((attendance: Attendance): boolean => attendance.studentId === id) ?? null;
  }

  async findByClassId(id: string): Promise<Attendance | null> {
    return this.attendances.find((attendance: Attendance): boolean => attendance.gradeId === id) ?? null;
  }

  async findAll(): Promise<Attendance[]> {
    return this.attendances;
  }

  async update(id: string, patch: Partial<Attendance>): Promise<Attendance | null> {
    const index = this.attendances.findIndex(
      (item: Attendance): boolean => item.attendanceId === id,
    );
    if (index === -1) return null;

    const updated: Attendance = { ...this.attendances[index], ...patch };
    this.attendances[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.attendances.findIndex(
      (item: Attendance): boolean => item.attendanceId === id,
    );
    if (index === -1) return false;

    this.attendances.splice(index, 1);
    return true;
  }
}
