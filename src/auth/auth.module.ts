import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CommonModule } from 'src/common/common.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategy/local.strategy';
import { AccessStrategy } from './strategy/access.strategy';
import { RefreshStrategy } from './strategy/refresh.strategy';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [CommonModule, PassportModule, JwtModule, MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtService,
    AccessStrategy,
    RefreshStrategy,
  ],
  exports: [AuthService, LocalStrategy, AccessStrategy, RefreshStrategy],
})
export class AuthModule {}
