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

@UseGuards(AccessGuard)
@Controller('api/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // /comment
  // return: {id:commentId}
  @Post()
  async create(
    @RequestUser() requestUser: RequestUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.create(requestUser, createCommentDto);
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
    return this.commentService.update(id, requestUser, updateCommentDto);
  }

  // /comment/:id?password=string
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('password') password: string,
    @RequestUser() requestUser: RequestUser,
  ) {
    return this.commentService.remove(id, password, requestUser);
  }
}
