import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/** Outbound mail descriptor. */
export interface OutgoingEmail {
  /** Recipient address. */
  to: string;
  /** Subject line. */
  subject: string;
  /** Plain-text body. */
  text: string;
  /** Optional HTML body. */
  html?: string;
}

/** Mailer abstraction (allows JSON transport for tests). */
export interface Mailer {
  /** Dispatch an email; resolves once the SMTP server has acknowledged. */
  send(email: OutgoingEmail): Promise<void>;
}

/**
 * Build the production SMTP mailer from `env.SMTP_URL`.
 */
export function createSmtpMailer(): Mailer {
  const transport: Transporter = nodemailer.createTransport(env.SMTP_URL);
  return {
    send: async (email): Promise<void> => {
      try {
        await transport.sendMail({ from: env.EMAIL_FROM, ...email });
      } catch (err) {
        logger.error({ err, to: email.to, subject: email.subject }, 'mailer.send failed');
      }
    },
  };
}

/**
 * Build a JSON-transport mailer that records messages in-memory.
 * Used by integration & e2e tests.
 */
export function createJsonMailer(): Mailer & { readonly sent: OutgoingEmail[] } {
  const sent: OutgoingEmail[] = [];
  return {
    sent,
    send: async (email): Promise<void> => {
      sent.push(email);
      return Promise.resolve();
    },
  };
}

/** Lazily-built default mailer. */
let defaultMailer: Mailer | null = null;

/** Get the default (SMTP) mailer. */
export function getMailer(): Mailer {
  if (defaultMailer === null) {
    defaultMailer = createSmtpMailer();
  }
  return defaultMailer;
}

/** Override the default mailer (test wiring). */
export function setMailer(mailer: Mailer): void {
  defaultMailer = mailer;
}
