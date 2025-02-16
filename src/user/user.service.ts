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

@Injectable()
export class UserService {
  private readonly saltOrRounds: number;
  private readonly refreshTokenKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
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
}
