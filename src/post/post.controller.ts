import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RequestUser } from '../auth/decorator/user.decorator';
import { RemovePostDto } from './dto/remove-post.dto';
import { AccessGuard } from '../auth/guard/access.guard';

@UseGuards(AccessGuard)
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // /post
  // return: {id: postId}
  @Post()
  create(
    @RequestUser() requestUser: RequestUser,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postService.create(requestUser, createPostDto);
  }

  // /post/:id
  // 게시글 상세 내용
  // return: {id, content, creationTime, modificationTime, viewCount, ratePlus, rateMinus,  creator, commentCount, username}
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  // /post
  // return: {id: postId}
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.update(id, requestUser, updatePostDto);
  }

  // /post
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() removePostDto: RemovePostDto,
  ) {
    return this.postService.remove(id, requestUser, removePostDto);
  }
}
