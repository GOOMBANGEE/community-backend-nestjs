import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VALIDATION_ERROR } from '../../common/exception/valid.exception';

export class CreateCommentDto {
  @IsInt({ message: VALIDATION_ERROR.ID_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.ID_ERROR })
  communityId: number;

  @IsInt({ message: VALIDATION_ERROR.ID_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.ID_ERROR })
  postId: number;

  @IsString({ message: VALIDATION_ERROR.CONTENT_ERROR })
  @IsNotEmpty({ message: VALIDATION_ERROR.CONTENT_ERROR })
  content: string;

  @IsOptional()
  username: string;

  @IsOptional()
  password: string;
}
