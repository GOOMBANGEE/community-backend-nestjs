import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(sendMailDto: SendMailDto): Promise<void> {
    const email = sendMailDto.email;
    const message = 'test';

    await this.mailerService.sendMail({
      to: email, // 수신자 이메일
      subject: 'test', // 메일 제목
      template: './test', // 이메일 템플릿 경로 (templates/test.hbs)
      context: {
        // 템플릿에 전달할 데이터
        message,
      },
    });
  }
}
