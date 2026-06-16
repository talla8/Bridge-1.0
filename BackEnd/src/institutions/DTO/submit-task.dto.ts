import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitInstitutionTaskDTO {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
