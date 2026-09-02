import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsInt } from 'class-validator';
import { ExecutionLanguage } from '@taskflow/shared';

export class CreateAssignmentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  starterCode?: string;

  @IsOptional()
  @IsEnum(ExecutionLanguage)
  language?: ExecutionLanguage;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  timeLimitMs?: number;

  @IsOptional()
  @IsInt()
  memoryLimitMb?: number;
}
