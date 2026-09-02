import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsInt, IsArray, ArrayMinSize } from 'class-validator';
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
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(ExecutionLanguage, { each: true })
  allowedLanguages?: ExecutionLanguage[];

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
