import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AccessGuard } from '../auth/guard/access.guard';
import { RequestUser } from '../auth/decorator/user.decorator';
import { AuthService } from '../auth/auth.service';
import { PostService } from '../post/post.service';
import { CommunityService } from '../community/community.service';

@UseGuards(AccessGuard)
@Controller('comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly authService: AuthService,
    private readonly communityService: CommunityService,
    private readonly postService: PostService,
  ) {}

  // /comment
  // return: {id:commentId}
  @Post()
  async create(
    @RequestUser() requestUser: RequestUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const [user, community, post] = await Promise.all([
      this.authService.validateRequestUser(requestUser),
      this.communityService.validateCommunity(createCommentDto.communityId),
      this.postService.validatePost(createCommentDto.postId),
    ]);
    return this.commentService.create(user, community, post, createCommentDto);
  }

  // /comment/:postId?page=1
  // return: {commentList: Comment[], total, page, totalPage}
  @Get(':postId')
  commentList(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page', ParseIntPipe) page: number = 1,
  ) {
    return this.commentService.commentList(postId, page);
  }

  // /comment/:id
  // return {id:commentId}
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const user = await this.authService.validateRequestUser(requestUser);
    return this.commentService.update(id, user, updateCommentDto);
  }

  // /comment/:id?password=string
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('password') password: string,
    @RequestUser() requestUser: RequestUser,
  ) {
    const user = await this.authService.validateRequestUser(requestUser);
    return this.commentService.remove(id, password, user);
  }
}
