import { MockSeedLoader } from './mock-seed.loader';
import { mockSeedManifest } from './mock-seed.manifest';
import { SeedBinding, SeedWritableRepository } from './mock-seed.types';

export interface SeedRepositories {
  admins?: SeedWritableRepository;
  users?: SeedWritableRepository;
  parents?: SeedWritableRepository;
  teachers?: SeedWritableRepository;
  schools?: SeedWritableRepository;
  grades?: SeedWritableRepository;
  subjects?: SeedWritableRepository;
  subjectOfferings?: SeedWritableRepository;
  students?: SeedWritableRepository;
  uploads?: SeedWritableRepository;
  skills?: SeedWritableRepository;
  exercises?: SeedWritableRepository;
  plans?: SeedWritableRepository;
  attendance?: SeedWritableRepository;
  assessmentResults?: SeedWritableRepository;
  skillExercises?: SeedWritableRepository;
  planLogs?: SeedWritableRepository;
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
      repository,
    });
  }

  await loader.seed(bindings);
}
