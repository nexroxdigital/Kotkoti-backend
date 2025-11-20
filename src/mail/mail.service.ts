import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private readonly logger = new Logger(MailService.name);

  onModuleInit() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async onModuleDestroy() {
    try { await this.transporter.close(); } catch (err) { /* ignore */ }
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text: text || html.replace(/<\/?[^>]+(>|$)/g, ''),
        html,
      });
      this.logger.debug(`Email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Error sending email: ' + (err as Error).message);
      throw err;
    }
  }
}
