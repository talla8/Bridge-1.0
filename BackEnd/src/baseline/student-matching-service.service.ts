import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NormalizedBaselineRow } from './baselineParser.service';
import { Student } from 'src/domain/student';
import { StudentsService } from 'src/students/students.service';
import { UserId } from 'src/domain/ids';

export type MatchedBaselineRow = NormalizedBaselineRow & {
  studentId: Student['studentId'];
};

@Injectable()
export class StudentMatchingServiceService {
  constructor(private readonly studentService: StudentsService) {}

  async matchStudents(
    normalizedRows: NormalizedBaselineRow[],
    teacherId: UserId,
  ): Promise<MatchedBaselineRow[]> {
    const teacherStudents = await this.studentService.getStudents(teacherId);

    const matchedRows = await Promise.all(
      normalizedRows.map(async (row): Promise<MatchedBaselineRow> => {
        if (!row.studentName) {
          throw new BadRequestException('Student name is missing from the row');
        }

        const students = teacherStudents.filter(
          (student) =>
            this.normalizeArabicName(student.fullArabicName) ===
            this.normalizeArabicName(row.studentName),
        );

        if (students.length === 0) {
          throw new NotFoundException(
            `Student not found for name: ${row.studentName}`,
          );
        }

        if (students.length > 1) {
          throw new BadRequestException(
            `Multiple students matched the name: ${row.studentName}`,
          );
        }

        const student = students[0];

        return {
          ...row,
          studentId: student.studentId,
        };
      }),
    );

    return matchedRows;
  }

  private normalizeArabicName(value: string | null | undefined): string {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');
  }
}
