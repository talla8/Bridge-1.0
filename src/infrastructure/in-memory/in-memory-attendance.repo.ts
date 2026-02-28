import { AttendanceRepository } from 'src/repositories/attendance.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryAttendancesRepo implements AttendanceRepository {
  private attendances: any[] = [];

  async upsert(attendance: any): Promise<any> {
    this.attendances.push(attendance);
    return attendance;
  }  // retake a look at this when you decide how exactly are you going to define this 

  async findById(id: string): Promise<any | null> {
    return this.attendances.find(function (attendance: any): boolean {
      return attendance.id === id;
    });
  }

    async findByStudentId(id: string): Promise<any | null> {
    return this.attendances.find(function (attendance: any): boolean {
      return attendance.studentId === id;
    });
  }

      async findByClassId(id: string): Promise<any | null> {
    return this.attendances.find(function (attendance: any): boolean {
      return attendance.classId === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.attendances;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.attendances.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.attendances[index];
    const updated = { ...current, ...patch };
    this.attendances[index] = updated;
    return updated;
  }  // retake a look at this when you decide how exactly are you going to define this  // should this and upsert be in one method? 

  async delete(id: string): Promise<boolean> {
    const index = this.attendances.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.attendances.splice(index, 1);
    return true;
  }
}
