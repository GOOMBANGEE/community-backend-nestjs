import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { CommunityModule } from '../community/community.module';
import { PostModule } from '../post/post.module';

@Module({
  imports: [CommonModule, AuthModule, CommunityModule, PostModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
