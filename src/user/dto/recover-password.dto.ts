import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class RecoverPasswordDto {
  @IsString({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*\d).{8,20}$/, {
    message: VALIDATION_ERROR.PASSWORD_ERROR,
  })
  password: string;

  @IsString({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.PASSWORD_ERROR })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*\d).{8,20}$/, {
    message: VALIDATION_ERROR.PASSWORD_ERROR,
  })
  confirmPassword: string;
}
