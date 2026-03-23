import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export type NormalizedBaselineRow = {
  serialNo: number | null;
  studentName: string | null;
  vocal: number | null;
  soundsOfLetters: number | null;
  writing: number | null;
  totalScore: number | null;
};

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

    console.log('first row:', rows[0]);
    return rows;
  }

  async validateHeaders(buffer: Buffer): Promise<HeaderMapping[]> {
    const headersTemplate: string[] = [
      'الرقم التسلسلي',
      'اسم الطالب',
      'الوعي الصوتي (6)',
      'قراءة أصوات الحروف (8)',
      'الكتابة (4)',
      'المجموع الكلي %',
    ];
    const mapping: (keyof NormalizedBaselineRow)[] = [
      'serialNo',
      'studentName',
      'vocal',
      'soundsOfLetters',
      'writing',
      'totalScore',
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
    const headers = data[0];

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

  async normalizeRows(buffer: Buffer): Promise<NormalizedBaselineRow[]> {
    const rows = await this.parseBuffer(buffer);
    const mappedHeaders = await this.validateHeaders(buffer);

    const normalizedRows = rows.map((row): NormalizedBaselineRow => {
      const normalizedRow: NormalizedBaselineRow = {
        serialNo: null,
        studentName: null,
        vocal: null,
        soundsOfLetters: null,
        writing: null,
        totalScore: null,
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
