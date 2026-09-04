import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendPinDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
