import { IsOptional } from 'class-validator';

export class RemovePostDto {
  @IsOptional()
  password: string;
}
