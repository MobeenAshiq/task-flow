import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  question: string;

  @IsString()
  @IsOptional()
  @MaxLength(20000)
  context?: string;
}
