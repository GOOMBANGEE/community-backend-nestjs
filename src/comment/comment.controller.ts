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
import { RemoveCommentDto } from './dto/remove-comment.dto';

@UseGuards(AccessGuard)
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // /comment
  // return: {id:commentId}
  @Post()
  create(
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
    @Query('page', ParseIntPipe) page: number,
  ) {
    return this.commentService.commentList(postId, page);
  }

  // /comment
  // return {id:commentId}
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(id, requestUser, updateCommentDto);
  }

  // /comment
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() removeCommentDto: RemoveCommentDto,
  ) {
    return this.commentService.remove(id, requestUser, removeCommentDto);
  }
}
