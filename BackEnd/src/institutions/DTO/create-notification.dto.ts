import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInstitutionNotificationDTO {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsArray()
  recipientTeacherUserIds?: string[];

  @IsOptional()
  @IsArray()
  recipientTeacherEmails?: string[];

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
