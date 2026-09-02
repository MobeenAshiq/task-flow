import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GradeDraftDto {
  @IsString()
  @IsNotEmpty()
  assignmentPrompt: string;

  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @IsString()
  @IsOptional()
  starterCode?: string;

  @IsOptional()
  testResults?: any;
}
