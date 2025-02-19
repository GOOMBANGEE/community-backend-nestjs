import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class CreatePostDto {
  @IsInt({ message: VALIDATION_ERROR.ID_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.ID_ERROR })
  communityId: number;

  @IsString({ message: VALIDATION_ERROR.TITLE_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.TITLE_ERROR })
  title: string;

  @IsString({ message: VALIDATION_ERROR.CONTENT_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.CONTENT_ERROR })
  content: string;

  @IsOptional()
  @Length(2, 20, { message: VALIDATION_ERROR.USERNAME_ERROR })
  username: string;

  @IsOptional()
  @Length(4, 20, { message: VALIDATION_ERROR.PASSWORD_ERROR })
  password: string;
}
