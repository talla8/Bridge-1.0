import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateInstitutionTaskDTO {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  assignedTeacherUserIds: string[];

  @IsOptional()
  @IsArray()
  assignedTeacherEmails?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
