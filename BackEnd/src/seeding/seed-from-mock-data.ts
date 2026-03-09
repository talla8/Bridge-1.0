import { MockSeedLoader } from './mock-seed.loader';
import { mockSeedManifest } from './mock-seed.manifest';
import { SeedBinding, SeedWritableRepository } from './mock-seed.types';

export interface SeedRepositories {
  admins?: unknown;
  users?: unknown;
  parents?: unknown;
  teachers?: unknown;
  schools?: unknown;
  grades?: unknown;
  subjects?: unknown;
  subjectOfferings?: unknown;
  students?: unknown;
  uploads?: unknown;
  skills?: unknown;
  exercises?: unknown;
  plans?: unknown;
  attendance?: unknown;
  assessmentResults?: unknown;
  skillExercises?: unknown;
  planLogs?: unknown;
}

export async function seedFromMockData(
  repositories: SeedRepositories,
  mockDataDir?: string,
): Promise<void> {
  const loader = new MockSeedLoader(mockDataDir);
  const bindings: SeedBinding[] = [];

  for (const [entity, repository] of Object.entries(repositories)) {
    if (!repository) continue;

    const fileName =
      mockSeedManifest[entity as keyof typeof mockSeedManifest] ?? undefined;

    if (!fileName) {
      throw new Error(`No mock-data file mapping found for entity "${entity}".`);
    }

    bindings.push({
      fileName,
      repository: repository as SeedWritableRepository,
    });
  }

  await loader.seed(bindings);
}
