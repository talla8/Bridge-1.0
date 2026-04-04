import { CurriculumItem } from 'src/domain/curriculum-item';

export interface CurriculumItemRepository {
  create(curriculumItem: CurriculumItem): Promise<CurriculumItem>;
  findById(id: string): Promise<CurriculumItem | null>;
  findAll(): Promise<CurriculumItem[]>;
  update(
    id: string,
    patch: Partial<CurriculumItem>,
  ): Promise<CurriculumItem | null>;
  delete(id: string): Promise<boolean>;
}
