import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SeedBinding, SeedRow, SeedWritableRepository } from './mock-seed.types';

export class MockSeedLoader {
  constructor(private readonly mockDataDir = join(process.cwd(), 'src/mock-data')) {}

  async seed(bindings: SeedBinding[]): Promise<void> {
    for (const binding of bindings) {
      const rows = await this.readRows(binding.fileName);
      await this.persistRows(binding.repository, rows);
    }
  }

  async readRows(fileName: string): Promise<SeedRow[]> {
    const fullPath = join(this.mockDataDir, fileName);
    const content = await readFile(fullPath, 'utf-8');
    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error(`Mock file "${fileName}" must contain a JSON array.`);
    }

    return parsed.map((row) => this.normalizeRow(row)) as SeedRow[];
  }

  private normalizeRow(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.normalizeRow(entry));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          this.toCamelCase(key),
          this.normalizeRow(entry),
        ]),
      );
    }

    return value;
  }

  private toCamelCase(key: string): string {
    return key.length === 0 ? key : key[0].toLowerCase() + key.slice(1);
  }

  private async persistRows(
    repository: SeedWritableRepository,
    rows: SeedRow[],
  ): Promise<void> {
    if (rows.length === 0) return;

    if (repository.createMany) {
      await repository.createMany(rows);
      return;
    }

    if (repository.create) {
      for (const row of rows) {
        await repository.create(row);
      }
      return;
    }

    if (repository.upsert) {
      for (const row of rows) {
        await repository.upsert(row);
      }
      return;
    }

    throw new Error(
      'Repository must expose at least one write method: createMany, create, or upsert.',
    );
  }
}
