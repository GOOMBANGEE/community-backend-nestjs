import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../common/prisma.service';
import {
  COMMENT_ERROR,
  CommentException,
} from '../common/exception/comment.exception';
import * as bcrypt from 'bcrypt';
import { Community, Post, User } from '@prisma/client';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // /comment
  // return: {id:commentId}
  async create(
    user: User,
    community: Community,
    post: Post,
    createCommentDto: CreateCommentDto,
  ) {
    let hashedPassword: string;
    if (!user) {
      hashedPassword = await this.authService.encryptPassword(
        createCommentDto.password,
      );
    }

    const [, comment] = await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id: createCommentDto.postId },
        data: { commentCount: { increment: 1 } },
      }),
      this.prisma.comment.create({
        data: {
          content: createCommentDto.content,
          creator: user ? user.id : null,
          username: user ? user.username : createCommentDto.username,
          password: user ? null : hashedPassword,
          communityId: community.id,
          postId: post.id,
        },
      }),
    ]);

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
  async update(id: number, user: User, updateCommentDto: UpdateCommentDto) {
    const comment = await this.validateComment(id);
    if (updateCommentDto.creator) {
      await this.prisma.comment.update({
        where: { id, creator: user.id },
        data: {
          content: updateCommentDto.content,
          modificationTime: new Date(),
        },
      });
      return id;
    }

    // updateCommentDto.creator === null
    if (await bcrypt.compare(updateCommentDto.password, comment.password)) {
      await this.prisma.comment.update({
        where: { id },
        data: {
          content: updateCommentDto.content,
          modificationTime: new Date(),
        },
      });
      return id;
    }

    throw new CommentException(COMMENT_ERROR.PERMISSION_DENIED);
  }

  // /comment
  async remove(id: number, password: string, user: User) {
    const comment = await this.validateComment(id);

    if (comment.creator) {
      await this.prisma.comment.delete({ where: { id, creator: user.id } });
      return;
    }

    if (await bcrypt.compare(password, comment.password)) {
      await this.prisma.comment.delete({ where: { id } });
      return;
    }

    throw new CommentException(COMMENT_ERROR.PERMISSION_DENIED);
  }

  async validateComment(id: number) {
    if (id) {
      return this.prisma.comment.findUnique({ where: { id } });
    }
    throw new CommentException(COMMENT_ERROR.COMMENT_INVALID);
  }
}
