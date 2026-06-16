import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export const MAX_PLAN_ITEM_ESTIMATED_MINUTES = 25;

export class UpdatePlanItemTimeDTO {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  planItemId: string;

  @IsInt()
  @Min(1)
  @Max(MAX_PLAN_ITEM_ESTIMATED_MINUTES)
  estimatedMinutes: number;
}
