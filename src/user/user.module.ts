import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [CommonModule, AuthModule, MailModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
