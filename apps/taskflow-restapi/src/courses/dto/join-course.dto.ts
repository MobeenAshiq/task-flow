import { IsString, IsNotEmpty, Length } from 'class-validator';

export class JoinCourseDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 10)
  joinCode: string;
}
