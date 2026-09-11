import { Injectable, Logger } from '@nestjs/common';

const RESEND_API_URL = 'https://api.resend.com/emails';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationPin(to: string, pin: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn(`RESEND_API_KEY not set — PIN for ${to} was not emailed.`);
      return;
    }

    const from = process.env.RESEND_FROM_EMAIL || 'TaskFlow <onboarding@resend.dev>';

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: 'Your TaskFlow verification PIN',
        text: `Your verification PIN is ${pin}. It expires in 10 minutes.`,
        html: `<p>Your verification PIN is <b style="font-size:1.2em">${pin}</b>.</p><p>It expires in 10 minutes.</p>`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Resend API error (${response.status}) sending PIN to ${to}: ${body}`);
      return;
    }
  }
}
