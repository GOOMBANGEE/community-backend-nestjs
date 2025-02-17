import { IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class RecoverPasswordDto {
  @IsString({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  password: string;

  @IsString({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  confirmPassword: string;
}
