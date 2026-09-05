import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  onModuleInit() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      this.logger.warn(
        'GMAIL_USER / GMAIL_APP_PASSWORD not set — verification emails will be logged instead of sent.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async sendVerificationPin(to: string, pin: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Mail transport not configured — PIN for ${to} was not emailed.`);
      return;
    }

    await this.transporter.sendMail({
      from: `TaskFlow <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Your TaskFlow verification PIN',
      text: `Your verification PIN is ${pin}. It expires in 10 minutes.`,
      html: `<p>Your verification PIN is <b style="font-size:1.2em">${pin}</b>.</p><p>It expires in 10 minutes.</p>`,
    });
  }
}
