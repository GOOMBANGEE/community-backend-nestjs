import { IsBoolean, IsNotEmpty } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class RateDto {
  @IsBoolean({ message: VALIDATION_ERROR.VALUE_INVALID })
  @IsNotEmpty({ message: VALIDATION_ERROR.VALUE_INVALID })
  rate: boolean;
}
