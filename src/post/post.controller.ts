import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CheckPasswordDto } from './dto/check-password.dto';
import { RateDto } from './dto/rate.dto';

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

  // /post/:id/check
  // 비회원 게시글만 진입
  @HttpCode(HttpStatus.OK)
  @Post(':id/check')
  checkPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() checkPasswordDto: CheckPasswordDto,
  ) {
    return this.postService.checkPassword(id, checkPasswordDto);
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

  // /post/:id/rate
  // 회원만 접근가능
  @HttpCode(HttpStatus.OK)
  @Post(':id/rate')
  rate(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() rateDto: RateDto,
  ) {
    return this.postService.rate(id, requestUser, rateDto);
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
