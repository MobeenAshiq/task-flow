import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
