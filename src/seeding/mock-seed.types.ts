export type SeedRow = Record<string, unknown>;

export interface SeedWritableRepository<T = SeedRow> {
  createMany?: (rows: T[]) => Promise<unknown>;
  create?: (row: T) => Promise<unknown>;
  upsert?: (row: T) => Promise<unknown>;
}

export interface SeedBinding<T = SeedRow> {
  fileName: string;
  repository: SeedWritableRepository<T>;
}
