import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envKey } from '../common/const/env.const';
import { Response } from 'express';
import { USER_ERROR, UserException } from '../common/exception/user.exception';
import { User } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { RecoverDto } from './dto/recover.dto';
import { MailService } from '../mail/mail.service';
import { v1 as uuidV1 } from 'uuid';
import { RecoverPasswordDto } from './dto/recover-password.dto';

@Injectable()
export class UserService {
  private readonly activationCodeLength: number;
  private readonly saltOrRounds: number;
  private readonly refreshTokenKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {
    this.activationCodeLength = this.configService.get(
      envKey.activationCodeLength,
    );
    this.saltOrRounds = Number(this.configService.get(envKey.saltOrRounds));
    this.refreshTokenKey = this.configService.get(envKey.refreshTokenKey);
  }

  // /user
  async update(user: User, updateUserDto: UpdateUserDto, response: Response) {
    // username update
    const username = updateUserDto.username;
    if (username) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { username },
      });
    }

    // password update
    const prevPassword = updateUserDto.prevPassword;
    const password = updateUserDto.password;
    const confirmPassword = updateUserDto.confirmPassword;
    if (password) {
      if (!(await bcrypt.compare(prevPassword, user.password))) {
        throw new UserException(USER_ERROR.PASSWORD_DO_NOT_MATCH);
      }
      if (password !== confirmPassword) {
        throw new UserException(USER_ERROR.PASSWORD_DO_NOT_MATCH);
      }

      const hashedPassword = await bcrypt.hash(password, this.saltOrRounds);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    // generate new accessToken, refreshToken
    const newUser = username ? { ...user, username } : user;
    const { accessToken, accessTokenExpires } =
      await this.authService.generateAccessToken(newUser);
    await this.authService.generateRefreshToken(newUser, response);
    return {
      username,
      accessToken,
      accessTokenExpires,
    };
  }

  // /user
  async delete(user: User, response: Response) {
    response.clearCookie(this.refreshTokenKey);
    await this.prisma.user.delete({ where: { id: user.id } });
  }

  async recover(recoverDto: RecoverDto) {
    // 해당 유저가 있는지 확인
    const email = recoverDto.email;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UserException(USER_ERROR.UNREGISTERED);
    }

    // 기존 userTempReset이 있는지 확인
    // 있다면 삭제하고 재생성
    const userTempReset = await this.prisma.userTempReset.findUnique({
      where: { userId: user.id },
    });
    if (userTempReset) {
      await this.prisma.userTempReset.delete({
        where: { id: userTempReset.id },
      });
    }

    // userResetTemp 저장
    const token = uuidV1();
    await this.prisma.userTempReset.create({
      data: { token, userId: user.id },
    });

    // 이메일 전송
    const recoverUrl = `${this.configService.get(envKey.frontUrl)}/user/recover/${token}`;
    this.mailService.sendMail(
      email,
      '비밀번호 재설정 페이지 입니다',
      recoverUrl,
    );
  }

  async recoverTokenCheck(token: string) {
    // token으로 userTempReset 검색
    const userResetTemp = await this.prisma.userTempReset.findUnique({
      where: { token },
    });
    if (!userResetTemp) {
      throw new UserException(USER_ERROR.UNREGISTERED);
    }
  }

  async recoverPassword(token: string, recoverPasswordDto: RecoverPasswordDto) {
    const password = recoverPasswordDto.password;
    const confirmPassword = recoverPasswordDto.confirmPassword;
    if (password !== confirmPassword) {
      throw new UserException(USER_ERROR.PASSWORD_DO_NOT_MATCH);
    }

    // token으로 userTempReset 검색
    const userResetTemp = await this.prisma.userTempReset.findUnique({
      where: { token },
    });
    if (!userResetTemp) {
      throw new UserException(USER_ERROR.UNREGISTERED);
    }

    // password 새로 등록
    const hashedPassword = await bcrypt.hash(password, this.saltOrRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userResetTemp.userId },
        data: { password: hashedPassword },
      }),
      // 기존 userTempReset삭제
      this.prisma.userTempReset.delete({ where: { id: userResetTemp.id } }),
    ]);
  }
}
