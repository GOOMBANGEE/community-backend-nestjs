import { Inject, Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Logger } from 'winston';
import { PrismaService } from '../common/prisma.service';
import {
  COMMUNITY_ERROR,
  CommunityException,
} from '../common/exception/community.exception';
import { RequestUser } from '../auth/decorator/user.decorator';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('winston') private readonly logger: Logger,
  ) {}

  // /community
  // admin만 접근가능
  create(requestUser: RequestUser, createCommunityDto: CreateCommunityDto) {
    if (!requestUser.role.includes('admin')) {
      this.logger.debug(
        'community create: ' + COMMUNITY_ERROR.PERMISSION_DENIED,
      );
      throw new CommunityException(COMMUNITY_ERROR.PERMISSION_DENIED);
    }

    const { title } = createCommunityDto;
    return this.prisma.community.create({
      data: { title, description: `${title} 게시판 입니다.` },
    });
  }

  // /community
  // return: {communityList: Community[], total: community.count, page: currentPage, totalPage}
  async communityList(page: number) {
    const limit = 20;
    const [communityList, total] = await this.prisma.$transaction([
      this.prisma.community.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.community.count(),
    ]);

    return {
      communityList,
      total,
      page,
      totalPage: Math.ceil(total / limit),
    };
  }

  // /community/:id
  // 게시판 전체 게시글 목록
  // return: {postList: Post[], total: community.count, page: currentPage, totalPage}
  async postList(id: number, page: number) {
    const limit = 20;
    const [postList, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { communityId: id },
        select: {
          id: true,
          title: true,
          creationTime: true,
          viewCount: true,
          ratePlus: true,
          rateMinus: true,
          commentCount: true,
          username: true,
        },
      }),
      this.prisma.post.count({ where: { communityId: id } }),
    ]);

    return {
      postList,
      total,
      page,
      totalPage: Math.ceil(total / limit),
    };
  }

  // /community
  // admin만 접근가능
  update(
    id: number,
    requestUser: RequestUser,
    updateCommunityDto: UpdateCommunityDto,
  ) {
    if (!requestUser.role.includes('admin')) {
      this.logger.debug(
        'community update: ' + COMMUNITY_ERROR.PERMISSION_DENIED,
      );
      throw new CommunityException(COMMUNITY_ERROR.PERMISSION_DENIED);
    }

    return this.prisma.community.update({
      where: { id },
      data: { ...updateCommunityDto },
    });
  }

  // /community
  // admin만 접근가능
  remove(id: number, requestUser: RequestUser) {
    if (!requestUser.role.includes('admin')) {
      this.logger.debug(
        'community remove: ' + COMMUNITY_ERROR.PERMISSION_DENIED,
      );
      throw new CommunityException(COMMUNITY_ERROR.PERMISSION_DENIED);
    }
    return this.prisma.community.delete({ where: { id } });
  }
}
