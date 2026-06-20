import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { StudentsService } from './students.service';
import { CreateStudentDTO } from './DTO/create.dto';
import { Student } from 'src/domain/student';
import { UserId } from 'src/domain/ids';
import { SqliteGradesRepo } from 'src/database/sqlite-grade.repo';

export type NormalizedStudentInfoRow = {
  fullArabicName: string | null;
  fullEnglishName: string | null;
  nationalID: string | null;
};

type HeaderMapping = [string, keyof NormalizedStudentInfoRow];

const HEADER_ROW_INDEX = 6;
const DATA_START_ROW_INDEX = 7;

@Injectable()
export class StudentUploadService {
  constructor(
    private readonly studentService: StudentsService,
    private readonly gradesRepo: SqliteGradesRepo,
  ) {}

  async excelParsing( //comment: i should remove this its not used
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
      'Full Arabic Name (Legal - 4 parts) الاسم العربي الكامل (قانوني - رباعي)',
      'Full English Name (Legal - 4 parts) الاسم الإنجليزي الكامل (قانوني - رباعي)',
      'National ID الرقم الوطني',
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
    const headers = data[HEADER_ROW_INDEX];

    if (!headers) {
      throw new BadRequestException('Excel file contains no header row');
    }

    for (let i = 0; i < headersTemplate.length; i++) {
      const actualHeader = this.normalizeHeaderValue(headers[i]);
      const expectedHeader = this.normalizeHeaderValue(headersTemplate[i]);

      if (actualHeader !== expectedHeader) {
        throw new BadRequestException(`Invalid header at column ${i + 1}`);
      }
    }

    const mappedHeaders = headers.map((header, index): HeaderMapping => {
      if (typeof header !== 'string') {
        throw new BadRequestException(`Invalid header at column ${index + 1}`);
      }

      return [header, mapping[index]];
    });

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
    const headers = data[HEADER_ROW_INDEX];

    if (!headers) {
      throw new BadRequestException('Excel file contains no header row');
    }

    const rows = data
      .slice(DATA_START_ROW_INDEX)
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

  private normalizeHeaderValue(
    value: string | number | null | undefined,
  ): string {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async createStudents(
    buffer: Buffer,
    teacherId: UserId,
  ): Promise<Student[]> {
    const normalizedRows = await this.normalizeRows(buffer);
    const teacherGrade = await this.gradesRepo.findByTeacherId(teacherId);
    const resolvedGradeId = teacherGrade?.gradeId ?? 'Third Grade';
    const resolvedSchoolName = teacherGrade?.schoolName ?? '';

    const studentsToCreate: CreateStudentDTO[] = normalizedRows
      .filter((row) => row.fullArabicName || row.fullEnglishName)
      .map((row) => ({
        fullArabicName: row.fullArabicName ?? '',
        fullEnglishName: row.fullEnglishName ?? row.fullArabicName ?? '',
        nationalId: row.nationalID ?? '',
        grade: resolvedGradeId,
      }));

    return this.studentService.createMany(studentsToCreate, {
      teacherId,
      schoolName: resolvedSchoolName,
    });
  }
}
