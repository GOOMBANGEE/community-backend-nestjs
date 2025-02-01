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
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { AccessGuard } from '../auth/guard/access.guard';
import { RequestUser } from '../auth/decorator/user.decorator';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // /community
  // admin만 접근가능
  @UseGuards(AccessGuard)
  @Post()
  create(
    @RequestUser() requestUser: RequestUser,
    @Body() createCommunityDto: CreateCommunityDto,
  ) {
    return this.communityService.create(requestUser, createCommunityDto);
  }

  // /community
  // return: {communityList: Community[], total: community.count, page: currentPage, totalPage}
  @Get()
  communityList(@Query('page', ParseIntPipe) page: number = 1) {
    return this.communityService.communityList(page);
  }

  // /community/:id
  // 게시판 전체 게시글 목록
  // return: {postList: Post[], total: community.count, page: currentPage, totalPage}
  @Get(':id')
  postList(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', ParseIntPipe) page: number = 1,
  ) {
    return this.communityService.postList(id, page);
  }

  // /community
  // admin만 접근가능
  @UseGuards(AccessGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ) {
    return this.communityService.update(id, requestUser, updateCommunityDto);
  }

  // /community
  // admin만 접근가능
  @UseGuards(AccessGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() requestUser: RequestUser,
  ) {
    return this.communityService.remove(id, requestUser);
  }
}
