import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AnalyzeCodeDto {
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @IsString()
  @IsOptional()
  language?: string;
}
