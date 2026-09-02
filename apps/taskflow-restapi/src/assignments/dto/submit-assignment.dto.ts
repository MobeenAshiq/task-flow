import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ExecutionLanguage } from '@taskflow/shared';

export class SubmitAssignmentDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsEnum(ExecutionLanguage)
  language: ExecutionLanguage;
}
