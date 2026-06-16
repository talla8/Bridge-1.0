import { BadRequestException, Injectable } from '@nestjs/common';
import { SubjectId } from 'src/domain/ids';
import {
  BaselineScoreField,
  COMMON_BASELINE_HEADERS,
  getSubjectSkillDefinitions,
  normalizeBaselineHeaderValue,
} from 'src/domain/subject-skill-config';
import * as XLSX from 'xlsx';

export type NormalizedBaselineRow = {
  serialNo: number | null;
  studentName: string | null;
  totalScore: number | null;
} & Record<BaselineScoreField, number | null>;

type HeaderMapping = [string, keyof NormalizedBaselineRow];

@Injectable()
export class BaselineParserService {
  async parseBuffer(buffer: Buffer): Promise<Record<string, unknown>[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: null,
    });

    if (!rows.length) {
      throw new BadRequestException('Excel file contains no data rows');
    }

    return rows;
  }

  async validateHeaders(
    buffer: Buffer,
    subjectId?: SubjectId,
  ): Promise<HeaderMapping[]> {
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
    const headers = data[0];

    if (!headers) {
      throw new BadRequestException('Excel file contains no header row');
    }

    const expectedColumns: {
      aliases: readonly string[];
      field: keyof NormalizedBaselineRow;
    }[] = [
      {
        aliases: COMMON_BASELINE_HEADERS.serialNo,
        field: 'serialNo',
      },
      {
        aliases: COMMON_BASELINE_HEADERS.studentName,
        field: 'studentName',
      },
      ...getSubjectSkillDefinitions(subjectId).map((definition) => ({
        aliases: definition.headerAliases,
        field: definition.field,
      })),
      {
        aliases: COMMON_BASELINE_HEADERS.totalScore,
        field: 'totalScore',
      },
    ];

    for (let i = 0; i < expectedColumns.length; i++) {
      const actualHeader = normalizeBaselineHeaderValue(headers[i]);
      const validAliases = expectedColumns[i].aliases.map((alias) =>
        normalizeBaselineHeaderValue(alias),
      );

      if (!validAliases.includes(actualHeader)) {
        throw new BadRequestException(`Invalid header at column ${i + 1}`);
      }
    }

    return expectedColumns.map((_, index): HeaderMapping => [
      String(headers[index]),
      expectedColumns[index].field,
    ]);
  }

  async normalizeRows(
    buffer: Buffer,
    subjectId?: SubjectId,
  ): Promise<NormalizedBaselineRow[]> {
    const rows = await this.parseBuffer(buffer);
    const mappedHeaders = await this.validateHeaders(buffer, subjectId);

    return rows.map((row): NormalizedBaselineRow => {
      const normalizedRow: NormalizedBaselineRow = {
        serialNo: null,
        studentName: null,
        totalScore: null,
        vocal: null,
        soundsOfLetters: null,
        writing: null,
        counting: null,
        numberManipulation: null,
        problemSolving: null,
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
  }

  private normalizeCellValue(
    field: keyof NormalizedBaselineRow,
    value: unknown,
  ): string | number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        return null;
      }

      if (field === 'studentName') {
        return trimmedValue;
      }

      const numericValue =
        field === 'totalScore'
          ? Number(trimmedValue.replace('%', '').trim())
          : Number(trimmedValue);

      return Number.isNaN(numericValue) ? null : numericValue;
    }

    if (field === 'studentName') {
      const normalizedName = String(value).trim();
      return normalizedName || null;
    }

    if (typeof value === 'number') {
      return value;
    }

    return null;
  }
}
