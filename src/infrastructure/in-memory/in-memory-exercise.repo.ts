import { ExerciseRepository } from 'src/repositories/exercise.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryExercisesRepo implements ExerciseRepository {
  private exercises: any[] = [];

  async create(exercise: any): Promise<any> {
    this.exercises.push(exercise);
    return exercise;
  }

  async findById(id: string): Promise<any | null> {
    return this.exercises.find(function (exercise: any): boolean {
      return exercise.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.exercises;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.exercises.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.exercises[index];
    const updated = { ...current, ...patch };
    this.exercises[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.exercises.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.exercises.splice(index, 1);
    return true;
  }
}
