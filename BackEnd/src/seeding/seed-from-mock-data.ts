import { MockSeedLoader } from './mock-seed.loader';
import { mockSeedManifest } from './mock-seed.manifest';
import {
  SeedBinding,
  SeedRow,
  SeedRowTransformer,
  SeedWritableRepository,
} from './mock-seed.types';

export interface SeedRepositoryConfig<T = SeedRow> {
  repository: SeedWritableRepository<T>;
  transformRows?: SeedRowTransformer<T>;
}

type SeedRepositoryEntry = unknown;

export interface SeedRepositories {
  admins?: SeedRepositoryEntry;
  users?: SeedRepositoryEntry;
  parents?: SeedRepositoryEntry;
  teachers?: SeedRepositoryEntry;
  schools?: SeedRepositoryEntry;
  grades?: SeedRepositoryEntry;
  subjects?: SeedRepositoryEntry;
  subjectOfferings?: SeedRepositoryEntry;
  students?: SeedRepositoryEntry;
  uploads?: SeedRepositoryEntry;
  skills?: SeedRepositoryEntry;
  exercises?: SeedRepositoryEntry;
  plans?: SeedRepositoryEntry;
  attendance?: SeedRepositoryEntry;
  assessmentResults?: SeedRepositoryEntry;
  skillExercises?: SeedRepositoryEntry;
  planLogs?: SeedRepositoryEntry;
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
      ...resolveSeedRepository(repository),
    });
  }

  await loader.seed(bindings);
}

function resolveSeedRepository(repository: SeedRepositoryEntry): {
  repository: SeedWritableRepository;
  transformRows?: SeedRowTransformer;
} {
  if (
    repository &&
    typeof repository === 'object' &&
    'repository' in repository
  ) {
    const config = repository as SeedRepositoryConfig;
    return {
      repository: config.repository,
      transformRows: config.transformRows,
    };
  }

  return { repository: repository as SeedWritableRepository };
}
