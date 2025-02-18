import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshGuard } from './guard/refresh.guard';
import { RequestUser, RequestUserLocal } from './decorator/user.decorator';
import { Response } from 'express';
import { AccessGuard } from './guard/access.guard';
import { AuthGuard } from '@nestjs/passport';
import { LocalGuard } from './guard/local.guard';
import { EmailActivateDto } from './dto/email-activate.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // /auth/register
  // return: set-cookie('token')
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // /auth/email/send?token=string
  // 이메일 재전송
  @Get('email/send')
  sendEmail(@Query('token') token: string) {
    return this.authService.sendEmail(token);
  }

  // /auth/email/activate?token=string
  // return: clear-cookie('token')
  @Post('email/activate')
  emailActivate(
    @Query('token') token: string,
    @Body() emailActivateDto: EmailActivateDto,
  ) {
    return this.authService.emailActivate(token, emailActivateDto);
  }

  // /auth/login
  // return: {username, accessToken, accessTokenExpire}, set-cookie('refreshToken')
  @UseGuards(AuthGuard('local')) // auth/strategy/local.strategy.ts return user; => request.user = user
  @Post('login')
  @UseGuards(LocalGuard) // auth/guard/local.guard.ts => LocalGuard extends AuthGuard('local')
  @HttpCode(HttpStatus.OK)
  login(
    @RequestUser() requestUser: RequestUserLocal,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(requestUser, response);
  }

  // /auth/refresh
  // return: {id, username, accessToken, accessTokenExpire}
  @Get('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @RequestUser() requestUser: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshToken(requestUser, response);
  }

  // /auth/logout
  // return: clear-cookie('refreshToken')
  @Get('logout')
  @UseGuards(AccessGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }
}
