import { IsEnum } from 'class-validator';
import { InstitutionTaskStatus } from '../domain/institution-task';

export class UpdateInstitutionTaskStatusDTO {
  @IsEnum(InstitutionTaskStatus)
  status: InstitutionTaskStatus;
}
