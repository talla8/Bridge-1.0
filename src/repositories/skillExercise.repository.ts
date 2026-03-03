import { SkillExercise } from 'src/domain/skillExercise';

export interface SkillExerciseRepository {
  create(skillExercise: SkillExercise): Promise<SkillExercise>;
  findById(id: string): Promise<SkillExercise | null>;
  findAll(): Promise<SkillExercise[]>;
  update(
    id: string,
    patch: Partial<SkillExercise>,
  ): Promise<SkillExercise | null>;
  delete(id: string): Promise<boolean>;
}
