import { Injectable } from '@nestjs/common';
import { Skill } from 'src/domain/skill';
import { SkillRepository } from 'src/repositories/skill.repository';

@Injectable()
export class InMemorySkillsRepo implements SkillRepository {
  private skills: Skill[] = [];

  async create(skill: Skill): Promise<Skill> {
    this.skills.push(skill);
    return skill;
  }

  async findById(id: string): Promise<Skill | null> {
    return this.skills.find((skill: Skill): boolean => String(skill.skillId) === id) ?? null;
  }

  async findAll(): Promise<Skill[]> {
    return this.skills;
  }

  async update(id: string, patch: Partial<Skill>): Promise<Skill | null> {
    const index = this.skills.findIndex(
      (item: Skill): boolean => String(item.skillId) === id,
    );
    if (index === -1) return null;

    const updated: Skill = { ...this.skills[index], ...patch };
    this.skills[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.skills.findIndex(
      (item: Skill): boolean => String(item.skillId) === id,
    );
    if (index === -1) return false;

    this.skills.splice(index, 1);
    return true;
  }
}
