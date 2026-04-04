import { SkillCurriculumItem } from 'src/domain/skill-curriculum-item';

export interface SkillCurriculumItemRepository {
  create(skillCurriculumItem: SkillCurriculumItem): Promise<SkillCurriculumItem>;
  findById(id: string): Promise<SkillCurriculumItem | null>;
  findAll(): Promise<SkillCurriculumItem[]>;
  update(
    id: string,
    patch: Partial<SkillCurriculumItem>,
  ): Promise<SkillCurriculumItem | null>;
  delete(id: string): Promise<boolean>;
}
