import { Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { PrismaService } from '../common/prisma.service';
import {
  COMMUNITY_ERROR,
  CommunityException,
} from '../common/exception/community.exception';
import { RequestUser } from '../auth/decorator/user.decorator';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  // /community
  // admin만 접근가능
  create(requestUser: RequestUser, createCommunityDto: CreateCommunityDto) {
    if (!requestUser.role.includes('admin')) {
      throw new CommunityException(COMMUNITY_ERROR.PERMISSION_DENIED);
    }

    const { title } = createCommunityDto;
    return this.prisma.community.create({
      data: { title, description: `${title} 게시판 입니다.` },
    });
  }

  // /community?page=number
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

  // /community/:id?mode=string&target=string&keyword=string&page=number
  // mode: best, null, target: title, content
  // 게시글 목록
  // return: {postList: Post[], total: community.count, page: currentPage, totalPage}
  async postList(
    id: number,
    mode: string,
    target: string,
    keyword: string,
    page: number,
  ) {
    const baseCondition: Prisma.PostWhereInput = { communityId: id };

    const isBestMode = mode === 'best';
    const modeCondition: Prisma.PostWhereInput = isBestMode
      ? { ratePlus: { gte: 1 } }
      : {};

    const searchCondition = [];
    if (keyword) {
      const searchField: Record<string, Prisma.PostWhereInput> = {
        all: {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
            { username: { contains: keyword } },
          ],
        },
        title: { title: { contains: keyword } },
        content: { content: { contains: keyword } },
        username: { username: { contains: keyword } },
        title_content: {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
          ],
        },
      };

      const option = searchField[target] || {};
      searchCondition.push(option);
    }

    const whereCondition: Prisma.PostWhereInput = {
      AND: [baseCondition, modeCondition, ...searchCondition],
    };

    const limit = 20;
    const [postList, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: whereCondition,
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
        orderBy: { id: 'desc' },
      }),
      this.prisma.post.count({ where: whereCondition }),
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
      throw new CommunityException(COMMUNITY_ERROR.PERMISSION_DENIED);
    }
    return this.prisma.community.delete({ where: { id } });
  }
}
