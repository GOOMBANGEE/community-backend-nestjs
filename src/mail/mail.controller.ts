import { Body, Controller, Post } from '@nestjs/common';
import { SendMailDto } from './dto/send-mail.dto';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  sendMail(@Body() sendMailDto: SendMailDto) {
    this.mailService.sendMail(sendMailDto);
  }
}
