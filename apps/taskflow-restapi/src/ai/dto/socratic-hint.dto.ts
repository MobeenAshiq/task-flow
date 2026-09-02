import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SocraticHintDto {
  @IsString()
  @IsNotEmpty()
  assignmentPrompt: string;

  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @IsString()
  @IsOptional()
  errorOutput?: string;
}
