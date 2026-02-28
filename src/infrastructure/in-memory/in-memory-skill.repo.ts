import { SkillRepository } from 'src/repositories/skill.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemorySkillsRepo implements SkillRepository {
  private skills: any[] = [];

  async create(skill: any): Promise<any> {
    this.skills.push(skill);
    return skill;
  }

  async findById(id: string): Promise<any | null> {
    return this.skills.find(function (skill: any): boolean {
      return skill.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.skills;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.skills.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.skills[index];
    const updated = { ...current, ...patch };
    this.skills[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.skills.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.skills.splice(index, 1);
    return true;
  }
}
