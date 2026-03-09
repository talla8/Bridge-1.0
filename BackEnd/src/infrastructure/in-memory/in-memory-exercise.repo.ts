import { Injectable } from '@nestjs/common';
import { Exercise } from 'src/domain/exercise';
import { ExerciseRepository } from 'src/repositories/exercise.repository';

@Injectable()
export class InMemoryExercisesRepo implements ExerciseRepository {
  private exercises: Exercise[] = [];

  async create(exercise: Exercise): Promise<Exercise> {
    this.exercises.push(exercise);
    return exercise;
  }

  async findById(id: string): Promise<Exercise | null> {
    return (
      this.exercises.find((exercise: Exercise): boolean => exercise.exerciseId === id) ??
      null
    );
  }

  async findAll(): Promise<Exercise[]> {
    return this.exercises;
  }

  async update(id: string, patch: Partial<Exercise>): Promise<Exercise | null> {
    const index = this.exercises.findIndex(
      (item: Exercise): boolean => item.exerciseId === id,
    );
    if (index === -1) return null;

    const updated: Exercise = { ...this.exercises[index], ...patch };
    this.exercises[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.exercises.findIndex(
      (item: Exercise): boolean => item.exerciseId === id,
    );
    if (index === -1) return false;

    this.exercises.splice(index, 1);
    return true;
  }
}
