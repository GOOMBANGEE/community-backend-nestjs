import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { envKey } from 'src/common/const/env.const';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { CookieOptions } from 'express-serve-static-core';
import { PrismaService } from '../common/prisma.service';
import { USER_ERROR, UserException } from '../common/exception/user.exception';
import { User } from '@prisma/client';
import { v1 as uuidV1 } from 'uuid';
import { MailService } from '../mail/mail.service';
import { EmailActivateDto } from './dto/email-activate.dto';
import {
  RequestUser,
  RequestUserLocal,
  UserBase,
} from './decorator/user.decorator';
import {
  VALIDATION_ERROR,
  ValidException,
} from '../common/exception/valid.exception';

@Injectable()
export class AuthService {
  private readonly activationCodeLength: number;
  private readonly saltOrRounds: number;
  private readonly accessTokenKey: string;
  private readonly accessTokenExpires: number;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenKey: string;
  private readonly refreshTokenExpires: number;
  private readonly refreshTokenSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    this.activationCodeLength = this.configService.get(
      envKey.activationCodeLength,
    );
    this.saltOrRounds = Number(this.configService.get(envKey.saltOrRounds));
    this.accessTokenKey = this.configService.get(envKey.accessTokenKey);
    this.accessTokenExpires = this.configService.get(envKey.accessTokenExpires);
    this.accessTokenSecret = this.configService.get(envKey.accessTokenSecret);
    this.refreshTokenKey = this.configService.get(envKey.refreshTokenKey);
    this.refreshTokenExpires = this.configService.get(
      envKey.refreshTokenExpires,
    );
    this.refreshTokenSecret = this.configService.get(envKey.refreshTokenSecret);
  }

  // /auth/register
  // return: set-cookie('token')
  async register(registerDto: RegisterDto) {
    const email = registerDto.email;
    const username = registerDto.username;
    const password = registerDto.password;
    const confirmPassword = registerDto.confirmPassword;

    if (password !== confirmPassword) {
      throw new UserException(USER_ERROR.PASSWORD_DO_NOT_MATCH);
    }

    // 중복체크
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    // 1 register -> 이미 등록된 이메일이 있을떄 -> checkUserToken
    if (existingUser) {
      await this.checkUserToken(existingUser);
    }

    // 2 register -> 이메일 중복검사 통과 -> 닉네임 검사
    if (await this.prisma.user.findUnique({ where: { username } })) {
      throw new UserException(USER_ERROR.USERNAME_EXIST);
    }

    // 3 register -> 중복된유저 없을때 -> saveUserInfo
    return await this.saveUserInfo(registerDto);
  }

  // 1 register -> 이미 등록된 이메일이 있을떄 -> checkUserToken
  // user.token 비어있는지 확인
  async checkUserToken(existingUser: User) {
    // 1-1 토큰값 비어있다 -> 인증완료되어 이미 가입완료된 상태 -> 중복이메일 에러
    if (!existingUser.token) {
      throw new UserException(USER_ERROR.MAIL_EXIST);
    }

    // 1-2 토큰값 존재하는경우 -> 아직 인증되지않은 상태
    // 24시간이 지나서 토큰이 만료되었는지 확인
    const expiredTokenDate = new Date(existingUser.registerDate);
    expiredTokenDate.setDate(expiredTokenDate.getDate() + 1);

    // 1-2-1 토큰이 만료된 경우 해당 유저를 삭제
    // 기존 등록되어있는 user, userTemp 삭제
    if (expiredTokenDate.getTime() <= Date.now()) {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.delete({ where: { email: existingUser.email } });
        await tx.userTemp.delete({
          where: { userId: existingUser.id },
        });
      });
    }
    throw new UserException(USER_ERROR.MAIL_EXIST);
  }

  // 3 register -> saveUserInfo
  async saveUserInfo(registerDto: RegisterDto) {
    const token = uuidV1();
    const password = registerDto.password;
    const confirmPassword = registerDto.confirmPassword;
    if (password !== confirmPassword) {
      throw new UserException(USER_ERROR.PASSWORD_DO_NOT_MATCH);
    }

    const hashedPassword = await bcrypt.hash(password, this.saltOrRounds);
    delete registerDto.confirmPassword;

    const user = await this.prisma.user.create({
      data: { ...registerDto, password: hashedPassword, token },
    });

    // activationCode generate
    const codeLength = this.activationCodeLength;
    const max = 10 ** codeLength - 1;
    const min = 10 ** (codeLength - 1);
    const activationCode = Math.floor(Math.random() * (max - min + 1) + min);

    await this.prisma.userTemp.create({
      data: { token, activationCode, userId: user.id },
    });

    // activationCode 메일 보내기
    const email = registerDto.email;
    this.mailService.sendMail(
      email,
      '이메일 인증 코드입니다',
      `${activationCode}`,
    );

    return { token };
  }

  // /auth/email/send
  // 이메일 재전송
  async sendEmail(token: string) {
    if (!token) {
      throw new UserException(USER_ERROR.TOKEN_INVALID);
    }

    const user = await this.prisma.user.findFirst({
      where: { token },
    });
    if (!user) {
      throw new UserException(USER_ERROR.UNREGISTERED);
    }

    const userTemp = await this.prisma.userTemp.findFirst({
      where: { userId: user.id },
    });
    this.mailService.sendMail(
      user.email,
      '이메일 인증 코드입니다',
      `${userTemp.activationCode}`,
    );
  }

  // /auth/email/activate
  // return: clear-cookie('token')
  async emailActivate(token: string, emailActivateDto: EmailActivateDto) {
    const { activationCode } = emailActivateDto;

    const user = await this.prisma.user.findFirst({ where: { token } });
    if (!user) {
      throw new UserException(USER_ERROR.UNREGISTERED);
    }
    const userTemp = await this.prisma.userTemp.findFirst({
      where: {
        userId: user.id,
        activationCode,
      },
    });
    if (!userTemp) {
      throw new UserException(USER_ERROR.ACTIVATION_CODE_INVALID);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { activated: true, token: null },
      });
      await tx.userTemp.delete({
        where: {
          userId: user.id,
          activationCode,
        },
      });
    });
  }

  // /auth/login -> localStrategy -> validateUser -> return user
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UserException(USER_ERROR.UNREGISTERED);
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const result = { ...user };
      delete result.password;

      if (!user.activated) {
        throw new UserException(USER_ERROR.ACTIVATE_REQUIRED);
      }
      return result;
    }

    throw new UserException(USER_ERROR.EMAIL_OR_PASSWORD_ERROR);
  }

  // /auth/login
  async login(requestUserLocal: RequestUserLocal, response: Response) {
    const { accessToken, accessTokenExpires } =
      await this.generateAccessToken(requestUserLocal);
    await this.generateRefreshToken(requestUserLocal, response);

    return {
      username: requestUserLocal.username,
      accessToken,
      accessTokenExpires,
    };
  }

  async generateAccessToken(user: UserBase) {
    const accessTokenExpires = this.accessTokenExpires;
    // expiresIn => 1s단위 => 3600 => 1h
    const accessToken = await this.jwtService.signAsync(
      {
        id: user.id,
        username: user.username,
        type: this.accessTokenKey,
        role: user.role,
      },
      { secret: this.accessTokenSecret, expiresIn: accessTokenExpires },
    );

    return { accessToken, accessTokenExpires };
  }

  async generateRefreshToken(user: UserBase, response: Response) {
    const refreshToken = await this.jwtService.signAsync(
      {
        id: user.id,
        username: user.username,
        type: this.refreshTokenKey,
        role: user.role,
      },
      { secret: this.refreshTokenSecret, expiresIn: this.refreshTokenExpires },
    );

    // maxAge => (Date.now() +) this.refreshTokenExpires (ms)
    const cookieOptions: CookieOptions = {
      httpOnly: true, // can't be accessed by JavaScript => reduces XSS risk
      secure: process.env.NODE_ENV === 'production', // send only over HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : undefined, // CSRF protection
      maxAge: this.refreshTokenExpires * 1000, // set cookie expiration
    };
    response.cookie(this.refreshTokenKey, refreshToken, cookieOptions);
  }

  // /auth/refresh
  async refreshToken(requestUser: RequestUser, response: Response) {
    if (
      requestUser.type !== this.refreshTokenKey ||
      Date.now() >= requestUser.exp * 1000
    ) {
      response.clearCookie(this.refreshTokenKey);
      throw new UserException(USER_ERROR.REFRESH_TOKEN_INVALID);
    }
    const { accessToken, accessTokenExpires } =
      await this.generateAccessToken(requestUser);

    return {
      id: requestUser.id,
      username: requestUser.username,
      accessToken,
      accessTokenExpires,
    };
  }

  // /auth/logout
  async logout(response: Response) {
    response.clearCookie(this.refreshTokenKey);
  }

  async encryptPassword(password: string) {
    if (password) {
      return await bcrypt.hash(password, this.saltOrRounds);
    }
    throw new ValidException([
      { property: password, message: VALIDATION_ERROR.PASSWORD_ERROR },
    ]);
  }

  async validateRequestUser(requestUser: RequestUser) {
    if (requestUser) {
      try {
        return await this.prisma.user.findUnique({
          where: { id: requestUser.id },
        });
      } catch (e) {
        throw new UserException(USER_ERROR.UNREGISTERED);
      }
    }
  }
}
