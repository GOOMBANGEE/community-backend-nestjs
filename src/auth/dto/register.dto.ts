import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class RegisterDto {
  @IsString({ message: VALIDATION_ERROR.EMAIL_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.EMAIL_ERROR })
  @IsEmail({}, { message: VALIDATION_ERROR.EMAIL_ERROR })
  email: string;

  @IsString({ message: VALIDATION_ERROR.USERNAME_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.USERNAME_ERROR })
  username: string;

  @IsString({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  password: string;

  @IsString({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  confirmPassword: string;
}
