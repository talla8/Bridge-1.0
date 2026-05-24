import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class CreateInstitutionNotificationDTO {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  recipientTeacherUserIds?: string[];
}
