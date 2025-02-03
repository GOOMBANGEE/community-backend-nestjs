import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { RequestUser } from '../auth/decorator/user.decorator';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import {
  COMMENT_ERROR,
  CommentException,
} from '../common/exception/comment.exception';
import { RemoveCommentDto } from './dto/remove-comment.dto';
import * as bcrypt from 'bcrypt';
import { envKey } from '../common/const/env.const';

@Injectable()
export class CommentService {
  private readonly saltOrRounds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.saltOrRounds = Number(this.configService.get(envKey.saltOrRounds));
  }

  // /comment
  // return: {id:commentId}
  async create(requestUser: RequestUser, createCommentDto: CreateCommentDto) {
    let hashedPassword: string;
    if (!requestUser) {
      if (!createCommentDto.password) {
        throw new CommentException(COMMENT_ERROR.PASSWORD_INVALID);
      }
      hashedPassword = await bcrypt.hash(
        createCommentDto.password,
        this.saltOrRounds,
      );
    }

    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
    });
    if (!post) {
      throw new CommentException(COMMENT_ERROR.POST_INVALID);
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        creator: requestUser ? requestUser.id : null,
        username: requestUser
          ? requestUser.username
          : createCommentDto.username,
        password: requestUser ? null : hashedPassword,
        communityId: createCommentDto.communityId,
        postId: createCommentDto.postId,
      },
    });

    return comment.id;
  }

  // /comment/:postId?page=1
  // return: {commentList: Comment[], total, page, totalPage}
  async commentList(postId: number, page: number) {
    const limit = 20;
    const [commentList, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { postId },
        select: {
          id: true,
          content: true,
          creationTime: true,
          modificationTime: true,
          creator: true,
          username: true,
        },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return {
      commentList,
      total,
      page,
      totalPage: Math.ceil(total / limit),
    };
  }

  // /comment
  // return {id:commentId}
  async update(
    id: number,
    requestUser: RequestUser,
    updateCommentDto: UpdateCommentDto,
  ) {
    if (updateCommentDto.creator) {
      if (!requestUser) {
        throw new CommentException(COMMENT_ERROR.PERMISSION_DENIED);
      }
      await this.prisma.comment.update({
        where: { id, creator: requestUser.id },
        data: { content: updateCommentDto.content },
      });
    }

    if (!updateCommentDto.creator) {
      const comment = await this.prisma.comment.findUnique({ where: { id } });
      if (
        updateCommentDto.password &&
        (await bcrypt.compare(updateCommentDto.password, comment.password))
      ) {
        await this.prisma.comment.update({
          where: { id },
          data: { content: updateCommentDto.content },
        });
      } else {
        throw new CommentException(COMMENT_ERROR.PERMISSION_DENIED);
      }
    }

    return id;
  }

  // /comment
  async remove(
    id: number,
    requestUser: RequestUser,
    removeCommentDto: RemoveCommentDto,
  ) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new CommentException(COMMENT_ERROR.COMMENT_INVALID);
    }

    if (comment.creator) {
      if (!requestUser) {
        throw new CommentException(COMMENT_ERROR.PERMISSION_DENIED);
      }
      await this.prisma.comment.delete({
        where: { id, creator: requestUser.id },
      });
      return;
    }

    if (
      !comment.creator &&
      removeCommentDto.password &&
      (await bcrypt.compare(removeCommentDto.password, comment.password))
    ) {
      await this.prisma.comment.delete({ where: { id } });
      return;
    }
    throw new CommentException(COMMENT_ERROR.PERMISSION_DENIED);
  }
}
