import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuizQuestionType } from 'src/domain/quiz';

class CreateQuizOptionDTO {
  @IsString()
  @IsNotEmpty()
  text: string;

  isCorrect: boolean;
}

class CreateQuizQuestionDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;

  @IsEnum(QuizQuestionType)
  type: QuizQuestionType;

  @ValidateIf(
    (question: CreateQuizQuestionDTO) =>
      question.type === QuizQuestionType.MULTIPLE_CHOICE,
  )
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDTO)
  options?: CreateQuizOptionDTO[];

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsString()
  attachmentFieldKey?: string;
}

export class CreateQuizDTO {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsOptional()
  @IsString()
  skillFocus?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDTO)
  questions: CreateQuizQuestionDTO[];
}
