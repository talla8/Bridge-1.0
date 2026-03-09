import { Exercise } from 'src/domain/exercise';

export interface ExerciseRepository {
  create(exercise: Exercise): Promise<Exercise>;
  findById(id: string): Promise<Exercise | null>;
  findAll(): Promise<Exercise[]>;
  update(id: string, patch: Partial<Exercise>): Promise<Exercise | null>;
  delete(id: string): Promise<boolean>;
}
