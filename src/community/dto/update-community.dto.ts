import { PartialType } from '@nestjs/mapped-types';
import { CreateCommunityDto } from './create-community.dto';
import { IsOptional } from 'class-validator';

export class UpdateCommunityDto extends PartialType(CreateCommunityDto) {
  @IsOptional()
  description: string;

  @IsOptional()
  thumbnail: string;
}
