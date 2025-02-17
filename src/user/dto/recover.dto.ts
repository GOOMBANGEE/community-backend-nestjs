import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class RecoverDto {
  @IsString({ message: VALIDATION_ERROR.EMAIL_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.EMAIL_ERROR })
  @IsEmail({}, { message: VALIDATION_ERROR.EMAIL_ERROR })
  email: string;
}
