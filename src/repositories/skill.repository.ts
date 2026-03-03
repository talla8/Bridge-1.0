import { Skill } from 'src/domain/skill';

export interface SkillRepository {
  create(skill: Skill): Promise<Skill>;
  findById(id: string): Promise<Skill | null>;
  findAll(): Promise<Skill[]>;
  update(id: string, patch: Partial<Skill>): Promise<Skill | null>;
  delete(id: string): Promise<boolean>;
}
