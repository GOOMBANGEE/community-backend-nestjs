import { IsNotEmpty, IsString } from 'class-validator';

export class SendMailDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}
