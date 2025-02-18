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
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RequestUser } from '../auth/decorator/user.decorator';
import { AccessGuard } from '../auth/guard/access.guard';
import { CheckPasswordDto } from './dto/check-password.dto';
import { RateDto } from './dto/rate.dto';
import { AuthService } from '../auth/auth.service';
import { CommunityService } from '../community/community.service';
import { USER_ERROR, UserException } from '../common/exception/user.exception';

@Controller('api/post')
@UseGuards(AccessGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly authService: AuthService,
    private readonly communityService: CommunityService,
  ) {}

  // /post
  // return: {id: postId}
  @Post()
  async create(
    @RequestUser() requestUser: RequestUser,
    @Body() createPostDto: CreatePostDto,
  ) {
    const [user, community] = await Promise.all([
      this.authService.validateRequestUser(requestUser),
      this.communityService.validateCommunity(createPostDto.communityId),
    ]);
    return this.postService.create(user, community, createPostDto);
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

  // /post/:id
  // return: {id: postId}
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const user = await this.authService.validateRequestUser(requestUser);
    return this.postService.update(id, user, updatePostDto);
  }

  // /post/:id/rate
  // 회원만 접근가능
  @HttpCode(HttpStatus.OK)
  @Post(':id/rate')
  async rate(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() rateDto: RateDto,
  ) {
    if (!requestUser) throw new UserException(USER_ERROR.UNREGISTERED);
    const user = await this.authService.validateRequestUser(requestUser);
    return this.postService.rate(id, user, rateDto);
  }

  // /post/:id?password=string
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('password') password: string,
    @RequestUser() requestUser: RequestUser,
  ) {
    const user = await this.authService.validateRequestUser(requestUser);
    return this.postService.remove(id, password, user);
  }
}
