import { IsNotEmpty, IsString, Length } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class CheckPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 20, { message: VALIDATION_ERROR.PASSWORD_ERROR })
  password: string;
}
