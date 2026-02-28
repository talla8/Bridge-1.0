import { SkillExerciseRepository } from 'src/repositories/skillExercise.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemorySkillExercisesRepo implements SkillExerciseRepository {
  private skillExercises: any[] = [];

  async create(skillExercise: any): Promise<any> {
    this.skillExercises.push(skillExercise);
    return skillExercise;
  }

  async findById(id: string): Promise<any | null> {
    return this.skillExercises.find(function (skillExercise: any): boolean {
      return skillExercise.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.skillExercises;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.skillExercises.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.skillExercises[index];
    const updated = { ...current, ...patch };
    this.skillExercises[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.skillExercises.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.skillExercises.splice(index, 1);
    return true;
  }
}
