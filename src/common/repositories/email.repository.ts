import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import { createTransport } from 'nodemailer';
import React from 'react';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { EmailImageAttachment } from '@/common/types';
import { WelcomeEmail } from '@/email/welcome.email';

export type SendEmailOptions = {
  from?: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  imageAttachments?: EmailImageAttachment[];
  smtp?: SmtpOptions;
};

export type SmtpOptions = {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  ignoreCert?: boolean;
};

export enum EmailTemplate {
  WELCOME = 'welcome',
  RESET_PASSWORD = 'reset-password',
}

interface BaseEmailProps {
  baseUrl: string;
  customTemplate?: string;
}

export interface WelcomeEmailProps extends BaseEmailProps {
  displayName: string;
  username: string;
  password?: string;
}

export type EmailRenderRequest = {
  template: EmailTemplate.WELCOME;
  data: WelcomeEmailProps;
  customTemplate: string;
};

export type SendEmailResponse = {
  messageId: string;
  response: any;
};

@Injectable()
export class EmailRepository {
  constructor(
    private logger: LoggingRepository,
    private configService: ConfigService,
  ) {
    this.logger.setContext(EmailRepository.name);
  }

  /**
   * Lấy cấu hình SMTP từ environment variables
   */
  getSmtpConfig(): SmtpOptions {
    const value = this.configService.get<SmtpOptions>('email.smtp');
    if (!value) {
      throw new Error('Email SMTP config is missing');
    }
    return value;
  }

  /**
   * Lấy thông tin người gửi từ environment variables
   */
  getFromConfig(): { name: string; address: string } {
    const value = this.configService.get<{ name: string; address: string }>(
      'email.from',
    );
    if (!value) {
      throw new Error('Email FROM config is missing');
    }
    return value;
  }

  /**
   * Lấy địa chỉ reply-to từ environment variables
   */
  getReplyToConfig(): string | undefined {
    return this.configService.get('email.replyTo');
  }

  /**
   * Lấy base URL từ environment variables
   */
  getBaseUrlConfig(): string {
    const value = this.configService.get<string>('email.baseUrl');
    if (!value) {
      throw new Error('Email baseUrl config is missing');
    }
    return value;
  }

  /**
   * Tạo chuỗi "Name <email>" cho trường from
   */
  getFormattedFrom(): string {
    const from = this.getFromConfig();
    return `${from.name} <${from.address}>`;
  }

  /**
   * Gửi email welcome với cấu hình từ environment
   */
  async sendWelcomeEmail(
    to: string,
    displayName: string,
    username: string,
    password?: string,
  ): Promise<SendEmailResponse> {
    const smtpConfig = this.getSmtpConfig();
    const from = this.getFormattedFrom();
    const replyTo = this.getReplyToConfig();
    const baseUrl = this.getBaseUrlConfig();

    // Render email template
    const emailData: EmailRenderRequest = {
      template: EmailTemplate.WELCOME,
      data: {
        displayName,
        username,
        password,
        baseUrl,
      },
      customTemplate: '',
    };

    const { html, text } = await this.renderEmail(emailData);

    return this.sendEmail({
      from,
      to,
      replyTo,
      subject: 'Chào mừng bạn đến với hệ thống!',
      html,
      text,
      smtp: smtpConfig,
    });
  }

  verifySmtp(options: SmtpOptions): Promise<true> {
    const transport = this.createTransport(options);
    try {
      return transport.verify();
    } finally {
      transport.close();
    }
  }

  async renderEmail(
    request: EmailRenderRequest,
  ): Promise<{ html: string; text: string }> {
    const component = this.render(request);
    const html = await render(component, { pretty: false });
    const text = await render(component, { plainText: true });
    return { html, text };
  }

  sendEmail({
    to,
    from,
    replyTo,
    subject,
    html,
    text,
    smtp,
    imageAttachments,
  }: SendEmailOptions): Promise<SendEmailResponse> {
    this.logger.debug(`Sending email to ${to} with subject: ${subject}`);
    const resolvedSmtp = smtp ?? this.getSmtpConfig();
    const resolvedFrom = from ?? this.getFormattedFrom();
    const resolvedReplyTo = replyTo ?? this.getReplyToConfig();
    const transport = this.createTransport(resolvedSmtp);

    const attachments = imageAttachments?.map((attachment) => ({
      filename: attachment.filename,
      path: attachment.path,
      cid: attachment.cid,
    }));

    try {
      return transport.sendMail({
        to,
        from: resolvedFrom,
        replyTo: resolvedReplyTo,
        subject,
        html,
        text,
        attachments,
      });
    } finally {
      transport.close();
    }
  }

  private render({
    template,
    data,
    customTemplate,
  }: EmailRenderRequest): React.FunctionComponentElement<any> {
    switch (template) {
      case EmailTemplate.WELCOME: {
        return React.createElement(WelcomeEmail, { ...data, customTemplate });
      }
    }
  }

  private createTransport(options: SmtpOptions) {
    return createTransport({
      host: options.host,
      port: options.port,
      tls: { rejectUnauthorized: !options.ignoreCert },
      auth:
        options.username || options.password
          ? {
              user: options.username,
              pass: options.password,
            }
          : undefined,
      connectionTimeout: 5000,
    });
  }
}
