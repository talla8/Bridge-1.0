import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlanItemStatus } from 'src/domain/plan-item';

export class UpdatePlanItemStatusDTO {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  planItemId: string;

  @IsEnum(PlanItemStatus)
  status: PlanItemStatus;
}
