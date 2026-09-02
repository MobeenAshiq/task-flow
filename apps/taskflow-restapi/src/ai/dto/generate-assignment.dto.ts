import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
