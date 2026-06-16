import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeacherMessageDTO {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
