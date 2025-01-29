import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envKey } from 'src/common/const/env.const';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// @UseGuards(RefreshGuard) => RefreshStrategy return payload: Request
@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.headers.cookie.split('refreshToken=')[1]; // 쿠키에서 refreshToken 가져옴
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get(envKey.refreshTokenSecret),
    });
  }

  validate(payload: Request) {
    return payload;
  }
}
