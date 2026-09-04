import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class ClassInsightsDto {
  @IsString()
  @IsNotEmpty()
  assignmentPrompt: string;

  @IsArray()
  submissions: any[];
}
