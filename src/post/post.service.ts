import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../common/prisma.service';
import { RequestUser } from '../auth/decorator/user.decorator';
import * as bcrypt from 'bcrypt';
import { envKey } from '../common/const/env.const';
import { ConfigService } from '@nestjs/config';
import { POST_ERROR, PostException } from '../common/exception/post.exception';
import { RemovePostDto } from './dto/remove-post.dto';
import { CheckPasswordDto } from './dto/check-password.dto';
import { RateDto } from './dto/rate.dto';

@Injectable()
export class PostService {
  private readonly saltOrRounds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.saltOrRounds = Number(this.configService.get(envKey.saltOrRounds));
  }

  // /post
  // return: id: postId
  async create(requestUser: RequestUser, createPostDto: CreatePostDto) {
    let hashedPassword: string;
    if (!requestUser) {
      if (!createPostDto.password) {
        throw new PostException(POST_ERROR.PASSWORD_INVALID);
      }
      hashedPassword = await bcrypt.hash(
        createPostDto.password,
        this.saltOrRounds,
      );
    }

    const community = await this.prisma.community.findUnique({
      where: { id: createPostDto.communityId },
    });
    if (!community) {
      throw new PostException(POST_ERROR.COMMUNITY_INVALID);
    }

    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        creator: requestUser ? requestUser.id : null,
        username: requestUser ? requestUser.username : createPostDto.username,
        password: requestUser ? null : hashedPassword,
        communityId: createPostDto.communityId,
      },
    });

    return post.id;
  }

  // /post/:id
  // 게시글 상세 내용
  // return: {id, content, creationTime, modificationTime, viewCount, ratePlus, rateMinus,  creator, commentCount, username}
  findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        creationTime: true,
        modificationTime: true,
        viewCount: true,
        ratePlus: true,
        rateMinus: true,
        creator: true,
        commentCount: true,
        username: true,
      },
    });
  }

  // /post/:id/check
  // 비회원 게시글만 진입
  async checkPassword(id: number, checkPasswordDto: CheckPasswordDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new PostException(POST_ERROR.POST_INVALID);
    }

    if (post.creator) {
      throw new PostException(POST_ERROR.PERMISSION_DENIED);
    }

    if (!(await bcrypt.compare(checkPasswordDto.password, post.password))) {
      throw new PostException(POST_ERROR.PASSWORD_INVALID);
    }
  }

  // /post
  // return: {id: postId}
  async update(
    id: number,
    requestUser: RequestUser,
    updatePostDto: UpdatePostDto,
  ) {
    // creator 있는 경우 회원 게시글 -> 회원검사
    if (updatePostDto.creator) {
      if (!requestUser) {
        throw new PostException(POST_ERROR.PERMISSION_DENIED);
      }
      await this.prisma.post.update({
        where: { id, creator: requestUser.id },
        data: updatePostDto,
      });
    }

    // creator 없는경우 비회원 게시글 -> 비밀번호 검사 로직 실행
    if (!updatePostDto.creator) {
      const post = await this.prisma.post.findUnique({ where: { id } });
      if (
        updatePostDto.password &&
        (await bcrypt.compare(updatePostDto.password, post.password))
      ) {
        await this.prisma.post.update({
          where: { id },
          data: { title: updatePostDto.title, content: updatePostDto.content },
        });
      } else {
        throw new PostException(POST_ERROR.PASSWORD_INVALID);
      }
    }

    return id;
  }

  // /post/:id/rate
  // 회원만 접근가능
  async rate(id: number, requestUser: RequestUser, rateDto: RateDto) {
    if (!requestUser) {
      throw new PostException(POST_ERROR.PERMISSION_DENIED);
    }

    if (!(await this.prisma.post.findUnique({ where: { id } }))) {
      throw new PostException(POST_ERROR.POST_INVALID);
    }

    if (rateDto.rate === true) {
      try {
        await this.prisma.$transaction([
          this.prisma.post.update({
            where: { id },
            data: { ratePlus: { increment: 1 } },
          }),
          this.prisma.postRatePlus.create({
            data: {
              postId: id,
              userId: requestUser.id,
            },
          }),
        ]);
      } catch (error) {
        // unique 조건
        if (error.code === 'P2002') {
          throw new PostException(POST_ERROR.RATE_PLUS_ALREADY);
        }
      }
    } else {
      try {
        await this.prisma.$transaction([
          this.prisma.post.update({
            where: { id },
            data: { rateMinus: { increment: 1 } },
          }),
          this.prisma.postRateMinus.create({
            data: {
              postId: id,
              userId: requestUser.id,
            },
          }),
        ]);
      } catch (error) {
        if (error.code === 'P2002') {
          // unique 조건
          throw new PostException(POST_ERROR.RATE_MINUS_ALREADY);
        }
      }
    }
  }

  // /post
  async remove(
    id: number,
    requestUser: RequestUser,
    removePostDto: RemovePostDto,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new PostException(POST_ERROR.POST_INVALID);
    }

    if (post.creator) {
      if (!requestUser) {
        throw new PostException(POST_ERROR.PERMISSION_DENIED);
      }
      await this.prisma.post.delete({ where: { id, creator: requestUser.id } });
      return;
    }

    if (
      !post.creator &&
      removePostDto.password &&
      (await bcrypt.compare(removePostDto.password, post.password))
    ) {
      await this.prisma.post.delete({
        where: { id },
      });
      return;
    }

    throw new PostException(POST_ERROR.PERMISSION_DENIED);
  }
}
