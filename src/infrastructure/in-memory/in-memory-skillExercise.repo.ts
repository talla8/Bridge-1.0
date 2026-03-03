import { Injectable } from '@nestjs/common';
import { SkillExercise } from 'src/domain/skillExercise';
import { SkillExerciseRepository } from 'src/repositories/skillExercise.repository';

@Injectable()
export class InMemorySkillExercisesRepo implements SkillExerciseRepository {
  private skillExercises: SkillExercise[] = [];

  async create(skillExercise: SkillExercise): Promise<SkillExercise> {
    this.skillExercises.push(skillExercise);
    return skillExercise;
  }

  async findById(id: string): Promise<SkillExercise | null> {
    return (
      this.skillExercises.find(
        (skillExercise: SkillExercise): boolean => skillExercise.exerciseId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<SkillExercise[]> {
    return this.skillExercises;
  }

  async update(
    id: string,
    patch: Partial<SkillExercise>,
  ): Promise<SkillExercise | null> {
    const index = this.skillExercises.findIndex(
      (item: SkillExercise): boolean => item.exerciseId === id,
    );
    if (index === -1) return null;

    const updated: SkillExercise = { ...this.skillExercises[index], ...patch };
    this.skillExercises[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.skillExercises.findIndex(
      (item: SkillExercise): boolean => item.exerciseId === id,
    );
    if (index === -1) return false;

    this.skillExercises.splice(index, 1);
    return true;
  }
}
