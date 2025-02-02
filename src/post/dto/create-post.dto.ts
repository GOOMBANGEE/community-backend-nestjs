import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
  username: string;

  @IsOptional()
  password: string;
}
