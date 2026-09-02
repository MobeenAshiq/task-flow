import { IsNotEmpty, IsString, IsUUID, IsDateString } from 'class-validator';

export class CreateLectureDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsDateString()
  date: string;

  @IsUUID()
  courseId: string;
}
