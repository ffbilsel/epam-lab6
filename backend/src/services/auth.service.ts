import { env } from '../config/env.js';
import { systemClock, type Clock } from '../infra/clock.js';
import { dummyVerify, verify as verifyHash } from '../infra/hasher.js';
import { LockedError, UnauthorizedError } from '../domain/errors.js';
import { record as auditRecord } from '../repositories/audit.repo.js';
import * as userRepo from '../repositories/user.repo.js';
import { buildSessionService, type IssuedSession, type SessionService } from './session.service.js';
import { buildNotificationService, type NotificationService } from './notification.service.js';
import { v4 as uuidv4 } from 'uuid';

/** Sign-in input. */
export interface SignInInput {
  /** Email address. */
  email: string;
  /** Plain-text password. */
  password: string;
  /** Source IP for audit. */
  ip?: string;
  /** User-Agent for audit. */
  userAgent?: string;
}

/** Authentication API. */
export interface AuthService {
  /** Sign in a user; returns session credentials. */
  signIn(input: SignInInput): Promise<IssuedSession>;
  /** Sign out a single session by jti. */
  signOut(jti: string, userId: string): Promise<void>;
}

/** Dependencies. */
export interface AuthDeps {
  /** Clock. */
  clock?: Clock;
  /** Session service. */
  sessions?: SessionService;
  /** Notification service. */
  notifications?: NotificationService;
}

/**
 * Build the auth service.
 * @param deps Optional dependencies.
 */
export function buildAuthService(deps: AuthDeps = {}): AuthService {
  const clock = deps.clock ?? systemClock;
  const sessions = deps.sessions ?? buildSessionService({ clock });
  const notifications = deps.notifications ?? buildNotificationService();

  return {
    signIn: async (input): Promise<IssuedSession> => {
      const now = clock.now();
      const email = input.email.trim().toLowerCase();
      const user = await userRepo.findByEmail(email);

      if (user === null) {
        await dummyVerify();
        await auditRecord({
          eventType: 'signin',
          outcome: 'failure',
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          metadata: { reason: 'unknown_email' },
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      if (user.email_verified_at === null) {
        await auditRecord({
          userId: user.id,
          eventType: 'signin',
          outcome: 'failure',
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          metadata: { reason: 'unverified' },
        });
        throw new UnauthorizedError('Email not verified', 'email_not_verified');
      }

      if (user.locked_until !== null && user.locked_until > now) {
        const retryAfter = Math.ceil((user.locked_until.getTime() - now.getTime()) / 1000);
        await auditRecord({
          userId: user.id,
          eventType: 'signin',
          outcome: 'failure',
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          metadata: { reason: 'locked' },
        });
        throw new LockedError('Account temporarily locked', retryAfter);
      }

      const ok = await verifyHash(input.password, user.password_hash);
      if (!ok) {
        const updated = await userRepo.incrementFailedAttempts(
          user.id,
          now,
          env.LOCKOUT_WINDOW_SECONDS,
        );
        if (updated.failed_attempt_count >= env.LOCKOUT_THRESHOLD) {
          const lockedUntil = new Date(now.getTime() + env.LOCKOUT_DURATION_SECONDS * 1000);
          await userRepo.setLockout(user.id, lockedUntil);
          await auditRecord({
            userId: user.id,
            eventType: 'account_lockout',
            outcome: 'success',
            ip: input.ip ?? null,
            userAgent: input.userAgent ?? null,
          });
          await notifications.notifyAccountLocked({ id: user.id, email: user.email }, uuidv4());
          throw new LockedError('Account temporarily locked', env.LOCKOUT_DURATION_SECONDS);
        }
        await auditRecord({
          userId: user.id,
          eventType: 'signin',
          outcome: 'failure',
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          metadata: { reason: 'bad_password' },
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      await userRepo.clearLockout(user.id);
      await auditRecord({
        userId: user.id,
        eventType: 'signin',
        outcome: 'success',
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      });
      return sessions.issue(user.id);
    },

    signOut: async (jti, userId): Promise<void> => {
      await sessions.revoke(jti);
      await auditRecord({ userId, eventType: 'signout', outcome: 'success' });
    },
  };
}
