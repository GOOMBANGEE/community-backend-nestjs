import { Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { PrismaService } from '../common/prisma.service';
import {
  COMMUNITY_ERROR,
  CommunityException,
} from '../common/exception/community.exception';
import { RequestUser } from '../auth/decorator/user.decorator';
import { Community, Post, Prisma } from '@prisma/client';

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
  // return: {communityList: (Community & { postList: Post[] })[], total: community.count, page: currentPage, totalPage}
  async communityList(page: number) {
    const limit = 20;
    const [communities, total] = await this.prisma.$transaction([
      this.prisma.community.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
        },
      }),
      this.prisma.community.count(),
    ]);
    const communityIds = communities.map(
      (community: Community) => community.id,
    );

    // queryRaw 각 커뮤니티별 상위 10개 게시글 조회
    // {
    //   id: 9,
    //   title: 'title',
    //   creation_time: 2025-02-02T07:02:31.816Z,
    //   comment_count: 0,
    //   community_id: 3
    // }
    const snakePostList = await this.prisma.$queryRaw<Post[]>`
    SELECT subquery.id,
           subquery.title,
           subquery.creation_time,
           subquery.comment_count,
           subquery.community_id 
    FROM (
        SELECT *,
            ROW_NUMBER() OVER (
            PARTITION BY "community_id" 
            ORDER BY id DESC
        ) as row_num
        FROM "Post"
        WHERE "community_id" IN (${Prisma.join(communityIds)})
    ) subquery
    WHERE row_num <= 10`;

    // snake to camel
    // {
    //   id: 9,
    //   title: 'title',
    //   creationTime: 2025-02-02T07:02:31.816Z,
    //   commentCount: 0,
    //   communityId: 3
    // }
    const postList = snakePostList.map((post) => {
      const camelCasedPost: Record<string, any> = {};
      Object.keys(post).forEach((key) => {
        camelCasedPost[key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())] =
          post[key];
      });
      return camelCasedPost;
    });

    const postCommunity = postList.reduce(
      (acc, post: Post) => {
        if (!acc[post.communityId]) acc[post.communityId] = [];
        acc[post.communityId].push(post);
        return acc;
      },
      {} as Record<number, Post[]>,
    );

    const communityList = communities.map((community) => ({
      ...community,
      postList: postCommunity[community.id] || [],
    }));

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
