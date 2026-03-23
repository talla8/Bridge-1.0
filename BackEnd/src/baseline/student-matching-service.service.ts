import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NormalizedBaselineRow } from './baselineParser.service';
import { Student } from 'src/domain/student';
import { StudentsService } from 'src/students/students.service';

export type MatchedBaselineRow = NormalizedBaselineRow & {
  studentId: Student['studentId'];
};

@Injectable()
export class StudentMatchingServiceService {
  constructor(private readonly studentService: StudentsService) {}

  async matchStudents(
    normalizedRows: NormalizedBaselineRow[],
  ): Promise<MatchedBaselineRow[]> {
    const matchedRows = await Promise.all(
      normalizedRows.map(async (row): Promise<MatchedBaselineRow> => {
        if (!row.studentName) {
          throw new BadRequestException('Student name is missing from the row');
        }
        console.log(row.studentName);

        const students = await this.studentService.findByArabicName(
          row.studentName,
        );

        if (!students.length) {
          throw new NotFoundException(
            `Student not found for name: ${row.studentName}`,
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
}
