import { IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  username: string;

  @IsOptional()
  prevPassword: string;

  @IsOptional()
  password: string;

  @IsOptional()
  confirmPassword: string;
}
