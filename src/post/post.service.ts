import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../common/prisma.service';
import { Logger } from 'winston';
import { RequestUser } from '../auth/decorator/user.decorator';
import * as bcrypt from 'bcrypt';
import { envKey } from '../common/const/env.const';
import { ConfigService } from '@nestjs/config';
import { POST_ERROR, PostException } from '../common/exception/post.exception';
import { RemovePostDto } from './dto/remove-post.dto';

@Injectable()
export class PostService {
  private readonly saltOrRounds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject('winston') private readonly logger: Logger,
  ) {
    this.saltOrRounds = Number(this.configService.get(envKey.saltOrRounds));
  }

  // /post
  // return: id: postId
  async create(requestUser: RequestUser, createPostDto: CreatePostDto) {
    let hashedPassword: string;
    if (!requestUser) {
      if (!createPostDto.password) {
        this.logger.debug('post create: ' + POST_ERROR.PASSWORD_INVALID);
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
      this.logger.debug('post create: ' + POST_ERROR.COMMUNITY_INVALID);
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
        this.logger.debug('post update: ' + POST_ERROR.PERMISSION_DENIED);
        throw new PostException(POST_ERROR.PERMISSION_DENIED);
      }
      const post = await this.prisma.post.update({
        where: { id, creator: requestUser.id },
        data: updatePostDto,
      });
      if (!post) {
        this.logger.debug('post update: ' + POST_ERROR.PERMISSION_DENIED);
        throw new PostException(POST_ERROR.PERMISSION_DENIED);
      }
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
        this.logger.debug('post update: ' + POST_ERROR.PASSWORD_INVALID);
        throw new PostException(POST_ERROR.PASSWORD_INVALID);
      }
    }

    return id;
  }

  // /post
  async remove(
    id: number,
    requestUser: RequestUser,
    removePostDto: RemovePostDto,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (post.creator) {
      if (!requestUser) {
        this.logger.debug('post remove: ' + POST_ERROR.PERMISSION_DENIED);
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

    this.logger.debug('post remove: ' + POST_ERROR.PERMISSION_DENIED);
    throw new PostException(POST_ERROR.PERMISSION_DENIED);
  }
}
