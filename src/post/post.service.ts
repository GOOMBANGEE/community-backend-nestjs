import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';
import { POST_ERROR, PostException } from '../common/exception/post.exception';
import { CheckPasswordDto } from './dto/check-password.dto';
import { RateDto } from './dto/rate.dto';
import { AuthService } from '../auth/auth.service';
import { CommunityService } from '../community/community.service';
import { RequestUser } from '../auth/decorator/user.decorator';
import { USER_ERROR, UserException } from '../common/exception/user.exception';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly communityService: CommunityService,
  ) {}

  // /post
  // return: id: postId
  async create(requestUser: RequestUser, createPostDto: CreatePostDto) {
    const [user, community] = await Promise.all([
      this.authService.validateRequestUser(requestUser),
      this.communityService.validateCommunity(createPostDto.communityId),
    ]);

    let hashedPassword: string;
    if (!user) {
      hashedPassword = await this.authService.encryptPassword(
        createPostDto.password,
      );
    }

    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        creator: user ? user.id : null,
        username: user ? user.username : createPostDto.username,
        password: user ? null : hashedPassword,
        communityId: community.id,
      },
    });
    return post.id;
  }

  // /post/:id
  // 게시글 상세 내용
  // return: {id, title, content, creationTime, modificationTime, viewCount, ratePlus, rateMinus,  creator, commentCount, username}
  async findOne(id: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.post.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        return tx.post.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
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
      });
    } catch (err) {
      throw new PostException(POST_ERROR.POST_INVALID);
    }
  }

  // /post/:id/check
  // 비회원 게시글만 진입
  async checkPassword(id: number, checkPasswordDto: CheckPasswordDto) {
    const post = await this.validatePost(id);
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
    const post = await this.validatePost(id);
    const user = await this.authService.validateRequestUser(requestUser);
    // creator 있는 경우 회원 게시글 -> 회원검사
    if (updatePostDto.creator) {
      await this.prisma.post.update({
        where: { id, creator: user.id },
        data: { ...updatePostDto, modificationTime: new Date() },
      });
      return id;
    }

    // creator 없는경우 비회원 게시글 -> 비밀번호 검사 로직 실행
    // updatePostDto.creator === null
    if (await bcrypt.compare(updatePostDto.password, post.password)) {
      await this.prisma.post.update({
        where: { id },
        data: {
          title: updatePostDto.title,
          content: updatePostDto.content,
          modificationTime: new Date(),
        },
      });
      return id;
    }

    throw new PostException(POST_ERROR.PERMISSION_DENIED);
  }

  // /post/:id/rate
  // 회원만 접근가능
  async rate(id: number, requestUser: RequestUser, rateDto: RateDto) {
    if (!requestUser) throw new UserException(USER_ERROR.UNREGISTERED);
    await this.validatePost(id);
    const user = await this.authService.validateRequestUser(requestUser);

    try {
      if (rateDto.rate) {
        await this.prisma.$transaction([
          this.prisma.post.update({
            where: { id },
            data: { ratePlus: { increment: 1 } },
          }),
          this.prisma.postRatePlus.create({
            data: {
              postId: id,
              userId: user.id,
            },
          }),
        ]);
        return;
      }
      await this.prisma.$transaction([
        this.prisma.post.update({
          where: { id },
          data: { rateMinus: { increment: 1 } },
        }),
        this.prisma.postRateMinus.create({
          data: {
            postId: id,
            userId: user.id,
          },
        }),
      ]);
    } catch (error) {
      if (error.code === 'P2002') {
        // unique 조건
        throw new PostException(
          rateDto.rate
            ? POST_ERROR.RATE_PLUS_ALREADY
            : POST_ERROR.RATE_MINUS_ALREADY,
        );
      }
    }
  }

  // /post
  async remove(id: number, password: string, requestUser: RequestUser) {
    const post = await this.validatePost(id);
    const user = await this.authService.validateRequestUser(requestUser);

    if (post.creator) {
      await this.prisma.post.delete({ where: { id, creator: user.id } });
      return;
    }

    if (await bcrypt.compare(password, post.password)) {
      await this.prisma.post.delete({ where: { id } });
      return;
    }

    throw new PostException(POST_ERROR.PERMISSION_DENIED);
  }

  async validatePost(id: number) {
    if (id) {
      return this.prisma.post.findUnique({ where: { id } });
    }
    throw new PostException(POST_ERROR.POST_INVALID);
  }
}
