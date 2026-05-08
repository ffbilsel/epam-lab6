import { getMailer, type Mailer } from '../infra/mailer.js';

/** Subset of user fields needed for notifications. */
export interface NotifiableUser {
  /** Stable user id (used for dedup keys). */
  id: string;
  /** Recipient email. */
  email: string;
}

/** Discrete event identifier for dedup. */
export type NotificationEvent =
  | { kind: 'password_changed'; userId: string; eventId: string }
  | { kind: 'reset_completed'; userId: string; eventId: string }
  | { kind: 'account_locked'; userId: string; eventId: string };

const seen: Set<string> = new Set();

/** Build a stable dedup key. */
function dedupKey(e: NotificationEvent): string {
  return `${e.kind}:${e.userId}:${e.eventId}`;
}

/** Notification sender (FR-016a). */
export interface NotificationService {
  /** Notify the user that their password was changed. */
  notifyPasswordChanged(user: NotifiableUser, eventId: string): Promise<void>;
  /** Notify the user that a password reset completed. */
  notifyResetCompleted(user: NotifiableUser, eventId: string): Promise<void>;
  /** Notify the user that their account was locked. */
  notifyAccountLocked(user: NotifiableUser, eventId: string): Promise<void>;
}

/**
 * Build the notification service.
 * @param mailer Mailer (defaults to {@link getMailer}).
 */
export function buildNotificationService(mailer: Mailer = getMailer()): NotificationService {
  return {
    notifyPasswordChanged: async (user, eventId): Promise<void> => {
      const key = dedupKey({ kind: 'password_changed', userId: user.id, eventId });
      if (seen.has(key)) return;
      seen.add(key);
      await mailer.send({
        to: user.email,
        subject: 'Your password was changed',
        text: 'Your password has been changed. If this was not you, please contact support.',
      });
    },
    notifyResetCompleted: async (user, eventId): Promise<void> => {
      const key = dedupKey({ kind: 'reset_completed', userId: user.id, eventId });
      if (seen.has(key)) return;
      seen.add(key);
      await mailer.send({
        to: user.email,
        subject: 'Password reset completed',
        text: 'Your password reset is complete. All previous sessions were signed out.',
      });
    },
    notifyAccountLocked: async (user, eventId): Promise<void> => {
      const key = dedupKey({ kind: 'account_locked', userId: user.id, eventId });
      if (seen.has(key)) return;
      seen.add(key);
      await mailer.send({
        to: user.email,
        subject: 'Your account is temporarily locked',
        text: 'We detected too many failed sign-in attempts. Your account is locked for 15 minutes.',
      });
    },
  };
}

/** Reset dedup cache (for tests). */
export function _resetNotificationDedup(): void {
  seen.clear();
}
