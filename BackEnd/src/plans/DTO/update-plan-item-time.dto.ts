import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UpdatePlanItemTimeDTO {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  planItemId: string;

  @IsInt()
  @Min(1)
  estimatedMinutes: number;
}
