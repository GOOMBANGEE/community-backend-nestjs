import { IsInt, IsNotEmpty } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class EmailActivateDto {
  @IsInt({ message: VALIDATION_ERROR.ACTIVATION_CODE_INVALID })
  @IsNotEmpty({ message: VALIDATION_ERROR.ACTIVATION_CODE_INVALID })
  activationCode: number;
}
