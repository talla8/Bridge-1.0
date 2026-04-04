import { Injectable } from '@nestjs/common';
import { SkillCurriculumItem } from 'src/domain/skill-curriculum-item';
import { SkillCurriculumItemRepository } from 'src/repositories/skill-curriculum-item.repository';

@Injectable()
export class InMemorySkillCurriculumItemsRepo
  implements SkillCurriculumItemRepository
{
  private skillCurriculumItems: SkillCurriculumItem[] = [];

  async create(
    skillCurriculumItem: SkillCurriculumItem,
  ): Promise<SkillCurriculumItem> {
    this.skillCurriculumItems.push(skillCurriculumItem);
    return skillCurriculumItem;
  }

  async findById(id: string): Promise<SkillCurriculumItem | null> {
    return (
      this.skillCurriculumItems.find(
        (skillCurriculumItem: SkillCurriculumItem): boolean =>
          skillCurriculumItem.curriculumItemId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<SkillCurriculumItem[]> {
    return this.skillCurriculumItems;
  }

  async update(
    id: string,
    patch: Partial<SkillCurriculumItem>,
  ): Promise<SkillCurriculumItem | null> {
    const index = this.skillCurriculumItems.findIndex(
      (item: SkillCurriculumItem): boolean => item.curriculumItemId === id,
    );
    if (index === -1) return null;

    const updated: SkillCurriculumItem = {
      ...this.skillCurriculumItems[index],
      ...patch,
    };
    this.skillCurriculumItems[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.skillCurriculumItems.findIndex(
      (item: SkillCurriculumItem): boolean => item.curriculumItemId === id,
    );
    if (index === -1) return false;

    this.skillCurriculumItems.splice(index, 1);
    return true;
  }
}
