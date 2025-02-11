import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { CommunityModule } from '../community/community.module';

@Module({
  imports: [CommonModule, AuthModule, CommunityModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
