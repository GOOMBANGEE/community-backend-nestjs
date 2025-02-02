import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';
import * as Joi from 'joi';
import { WinstonModule } from 'nest-winston';
import * as process from 'node:process';
import * as winston from 'winston';
import { CommonModule } from './common/common.module';
import { envKey } from './common/const/env.const';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { GlobalExceptionFilter } from './common/filter/global-exception.filter';
import { AppService } from './app.service';
import { CommunityModule } from './community/community.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000).required(),
        DB_URL: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
        SENTRY_DSN: Joi.string().required(),

        REGISTER_CODE_LENGTH: Joi.number().required(),
        SALT_OR_ROUNDS: Joi.number().required(),

        JWT_ACCESS_TOKEN_KEY: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRES: Joi.number().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_KEY: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRES: Joi.number().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),

        MAIL_TRANSPORT_HOST: Joi.string().required(),
        MAIL_TRANSPORT_AUTH_USER: Joi.string().required(),
        MAIL_TRANSPORT_AUTH_PASS: Joi.string().required(),
        MAIL_DEFAULTS_FROM: Joi.string().required(),
        MAIL_TEMPLATE_DIR: Joi.string().required(),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>(envKey.mailTransportHost), // SMTP 서버 호스트
          port: 587, // SMTP 포트
          auth: {
            user: configService.get<string>(envKey.mailTransportAuthUser), // SMTP 사용자 이메일
            pass: configService.get<string>(envKey.mailTransportAuthPass), // SMTP 비밀번호
          },
        },
        defaults: {
          from: configService.get<string>(envKey.mailDefaultsFrom), // 기본 발신자 정보
        },
        template: {
          dir: configService.get<string>(envKey.mailTemplateDir), // 이메일 템플릿 디렉토리
          adapter: new HandlebarsAdapter(), // Handlebars 템플릿 엔진
          options: {
            strict: true,
          },
        },
      }),
    }),
    SentryModule.forRoot(),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          // console 출력설정
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              const stringContext = context ? `[${String(context)}]` : '';
              return `[${String(timestamp)}] ${String(level)}: ${String(message)} ${stringContext}`;
            }),
          ),
        }),
        new winston.transports.File({
          // file export 설정
          filename: 'application.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(), // json 형식
          ),
        }),
      ],
    }),
    CommonModule,
    AuthModule,
    UserModule,
    CommunityModule,
    PostModule,
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
