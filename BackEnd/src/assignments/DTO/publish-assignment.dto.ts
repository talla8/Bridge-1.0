import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  AssignmentSourceType,
  AssignmentTargetType,
  AssignmentType,
} from 'src/domain/assignment';

export class PublishAssignmentDTO {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(AssignmentType)
  type: AssignmentType;

  @IsEnum(AssignmentSourceType)
  sourceType: AssignmentSourceType;

  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @IsEnum(AssignmentTargetType)
  targetType: AssignmentTargetType;

  @ValidateIf(
    (dto) => dto.targetType === AssignmentTargetType.SELECTED_STUDENTS,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  targetStudentIds?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
