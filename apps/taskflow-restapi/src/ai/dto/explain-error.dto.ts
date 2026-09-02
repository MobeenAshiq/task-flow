import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ExplainErrorDto {
  @IsString()
  @IsNotEmpty()
  errorStack: string;

  @IsString()
  @IsOptional()
  studentCode?: string;
}
