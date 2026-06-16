import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInstitutionTaskDTO {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  assignedTeacherUserIds: string[];

  @IsOptional()
  @IsArray()
  assignedTeacherEmails?: string[];

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
