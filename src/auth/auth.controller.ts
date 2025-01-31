import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshGuard } from './guard/refresh.guard';
import { RequestUser } from './decorator/user.decorator';
import { Request, Response } from 'express';
import { AccessGuard } from './guard/access.guard';
import { AuthGuard } from '@nestjs/passport';
import { LocalGuard } from './guard/local.guard';
import { EmailActivateDto } from './dto/email-activate.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // /auth/register
  // return: set-cookie('token')
  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.register(registerDto, response);
  }

  // /auth/email/send
  // 이메일 재전송
  @Get('email/send')
  sendEmail(@Req() request: Request) {
    return this.authService.sendEmail(request);
  }

  // /auth/email/activate
  // return: clear-cookie('token')
  @Post('email/activate')
  emailActivate(
    @Req() request: Request,
    @Body() emailActivateDto: EmailActivateDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.emailActivate(request, emailActivateDto, response);
  }

  // /auth/login
  // return: {username, accessToken, accessTokenExpire}, set-cookie('refreshToken')
  @UseGuards(AuthGuard('local')) // auth/strategy/local.strategy.ts return user; => request.user = user
  @Post('login')
  @UseGuards(LocalGuard) // auth/guard/local.guard.ts => LocalGuard extends AuthGuard('local')
  @HttpCode(HttpStatus.OK)
  login(
    @RequestUser() requestUser: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(requestUser, response);
  }

  // /auth/refresh
  // return: {username, accessToken, accessTokenExpire}
  @Get('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  refresh(@RequestUser() requestUser: RequestUser) {
    return this.authService.refreshToken(requestUser);
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
