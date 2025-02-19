import { Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { PrismaService } from '../common/prisma.service';
import { Prisma } from '@prisma/client';
import {
  COMMUNITY_ERROR,
  CommunityException,
} from '../common/exception/community.exception';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  // /community
  // admin만 접근가능
  async create(createCommunityDto: CreateCommunityDto) {
    const { title } = createCommunityDto;
    return this.prisma.community.create({
      data: {
        title: `${title} 게시판`,
        description: `${title} 게시판 입니다.`,
      },
    });
  }

  // /community?page=number
  // return: {communityList: (Community & { postList: Post[] })[], total: community.count, page: currentPage, totalPage}
  async communityList(page: number) {
    const limit = 10;
    const [communityList, total] = await this.prisma.$transaction([
      this.prisma.community.findMany({
        take: limit,
        select: {
          id: true,
          title: true,
          Post: {
            take: limit,
            select: {
              id: true,
              title: true,
              creationTime: true,
              commentCount: true,
              communityId: true,
            },
            orderBy: {
              id: 'desc',
            },
          },
        },
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
  // return: {community: Community, postList: Post[], total: community.count, page: currentPage, totalPage}
  async postList(
    id: number, // communityId
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
    const [community, postList, total] = await this.prisma.$transaction([
      // community
      this.prisma.community.findUnique({
        where: { id },
      }),
      // postList
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
          communityId: true,
        },
        orderBy: { id: 'desc' },
      }),
      // total
      this.prisma.post.count({ where: whereCondition }),
    ]);

    return {
      community,
      postList,
      total,
      page,
      totalPage: Math.ceil(total / limit),
    };
  }

  // /community
  // admin만 접근가능
  async update(id: number, updateCommunityDto: UpdateCommunityDto) {
    return this.prisma.community.update({
      where: { id },
      data: { ...updateCommunityDto },
    });
  }

  // /community
  // admin만 접근가능
  async remove(id: number) {
    return this.prisma.community.delete({ where: { id } });
  }

  async validateCommunity(id: number) {
    if (id) {
      return this.prisma.community.findUnique({
        where: { id },
      });
    }
    throw new CommunityException(COMMUNITY_ERROR.COMMUNITY_INVALID);
  }
}
