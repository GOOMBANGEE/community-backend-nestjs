import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';

declare const module: any; // hot reload | webpack 설정

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: frontendUrl, // 프론트엔드의 주소
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 허용할 HTTP 메서드
    credentials: true, // 인증 정보(쿠키 등) 포함 여부
  });

  // hot reload | webpack 설정
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  // sentry 설정
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  // validator 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에서 정의된 속성만 허용
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성은 거부
      transform: true, // 요청된 데이터를 DTO로 변환
      skipMissingProperties: false, // 필수 항목이 없으면 거부
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
