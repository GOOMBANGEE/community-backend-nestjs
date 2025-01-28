import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email, // 수신자 이메일
      subject: subject, // 메일 제목
      template: './registerMail', // 이메일 템플릿 경로 (templates/registerMail.hbs)
      context: {
        // 템플릿에 전달할 데이터
        message,
      },
    });
  }
}
