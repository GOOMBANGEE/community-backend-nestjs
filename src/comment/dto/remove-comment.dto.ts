import { IsOptional } from 'class-validator';

export class RemoveCommentDto {
  @IsOptional()
  password: string;
}
