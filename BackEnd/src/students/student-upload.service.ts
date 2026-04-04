import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { StudentsService } from './students.service';
import { CreateStudentDTO } from './DTO/create.dto';
import { Student } from 'src/domain/student';
import { UserId } from 'src/domain/ids';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';

export type NormalizedStudentInfoRow = {
  fullArabicName: string | null;
  fullEnglishName: string | null;
  nationalID: string | null;
};

type HeaderMapping = [string, keyof NormalizedStudentInfoRow];

@Injectable()
export class StudentUploadService {
  constructor(
    private readonly studentService: StudentsService,
    private readonly gradesRepo: InMemoryGradesRepo,
  ) {}

  async excelParsing(
    file: Express.Multer.File,
  ): Promise<NormalizedStudentInfoRow[]> {
    return this.normalizeRows(file.buffer);
  }

  async importStudents(
    file: Express.Multer.File,
    teacherId: UserId,
  ): Promise<Student[]> {
    return this.createStudents(file.buffer, teacherId);
  }

  async validateHeaders(buffer: Buffer): Promise<HeaderMapping[]> {
    const headersTemplate: string[] = [
      'Full Arabic Name (Legal - 4 parts)\nالاسم العربي الكامل (قانوني - رباعي)',
      'Full English Name (Legal - 4 parts)\nالاسم الإنجليزي الكامل (قانوني - رباعي)',
      'National ID\nالرقم الوطني',
    ];
    const mapping: (keyof NormalizedStudentInfoRow)[] = [
      'fullArabicName',
      'fullEnglishName',
      'nationalID',
    ];

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json<(string | number | null)[]>(
      worksheet,
      {
        header: 1,
        defval: null,
      },
    );
    const headers = data[6];

    if (!headers) {
      throw new BadRequestException('Excel file contains no header row');
    }

    for (let i = 0; i < headersTemplate.length; i++) {
      if (headers[i] !== headersTemplate[i]) {
        throw new BadRequestException(`Invalid header at column ${i + 1}`);
      }
    }

    const mappedHeaders = headersTemplate.map(
      (header, index): HeaderMapping => [header, mapping[index]],
    );

    console.log('mappedHeaders:', mappedHeaders);
    return mappedHeaders;
  }

  async normalizeRows(buffer: Buffer): Promise<NormalizedStudentInfoRow[]> {
    const rows = this.parseBuffer(buffer);
    const mappedHeaders = await this.validateHeaders(buffer);

    const normalizedRows = rows.map((row): NormalizedStudentInfoRow => {
      const normalizedRow: NormalizedStudentInfoRow = {
        fullArabicName: null,
        fullEnglishName: null,
        nationalID: null,
      };

      for (const [sourceHeader, targetHeader] of mappedHeaders) {
        const rawValue = row[sourceHeader];
        normalizedRow[targetHeader] = this.normalizeCellValue(
          targetHeader,
          rawValue,
        ) as never;
      }

      return normalizedRow;
    });

    console.log('normalizedRows:', normalizedRows);
    return normalizedRows;
  }

  private parseBuffer(buffer: Buffer): Record<string, unknown>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json<(string | number | null)[]>(
      worksheet,
      {
        header: 1,
        defval: null,
      },
    );
    const headers = data[7];

    if (!headers) {
      throw new BadRequestException('Excel file contains no header row');
    }

    const rows = data
      .slice(9)
      .filter((row) => row.some((cell) => cell !== null && cell !== ''))
      .map((row) => {
        const parsedRow: Record<string, unknown> = {};

        headers.forEach((header, index) => {
          if (typeof header === 'string') {
            parsedRow[header] = row[index] ?? null;
          }
        });

        return parsedRow;
      });

    if (!rows.length) {
      throw new BadRequestException('Excel file contains no data rows');
    }

    return rows;
  }

  private normalizeCellValue(
    field: keyof NormalizedStudentInfoRow,
    value: unknown,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        return null;
      }

      if (
        field === 'fullArabicName' ||
        field === 'fullEnglishName' ||
        field === 'nationalID'
      ) {
        return trimmedValue;
      }
    }

    if (typeof value === 'number') {
      return String(value);
    }

    const normalizedValue = String(value).trim();
    return normalizedValue || null;
  }

  private async createStudents(
    buffer: Buffer,
    teacherId: UserId,
  ): Promise<Student[]> {
    const normalizedRows = await this.normalizeRows(buffer);
    const teacherGrade = await this.gradesRepo.findByTeacherId(teacherId);

    if (!teacherGrade) {
      throw new NotFoundException('Teacher grade was not found');
    }

    const studentsToCreate: CreateStudentDTO[] = normalizedRows
      .filter((row) => row.fullArabicName || row.fullEnglishName)
      .map((row) => ({
        fullArabicName: row.fullArabicName ?? '',
        fullEnglishName: row.fullEnglishName ?? row.fullArabicName ?? '',
        nationalId: row.nationalID ?? '',
        grade: teacherGrade.gradeId,
      }));

    return this.studentService.createMany(studentsToCreate);
  }
}
