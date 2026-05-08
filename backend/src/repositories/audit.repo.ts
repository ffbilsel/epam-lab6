import type { PoolClient } from 'pg';
import { pool } from '../infra/db.js';

/** Audit event payload as recorded in `audit_events`. */
export interface AuditEvent {
  /** Owning user id, if known. */
  userId?: string | null;
  /** Event identifier, e.g. `signin`, `registration`, `account_lockout`. */
  eventType: string;
  /** Coarse outcome. */
  outcome: 'success' | 'failure';
  /** Source IP, if known. */
  ip?: string | null;
  /** Request user-agent, if known. */
  userAgent?: string | null;
  /** Free-form metadata (must be JSON-serialisable). */
  metadata?: Record<string, unknown>;
}

/**
 * Insert one audit row.
 * @param event Event payload.
 * @param client Optional pg client for transactional writes.
 */
export async function record(event: AuditEvent, client?: PoolClient): Promise<void> {
  const runner = client ?? pool;
  await runner.query(
    `INSERT INTO audit_events (user_id, event_type, outcome, ip, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      event.userId ?? null,
      event.eventType,
      event.outcome,
      event.ip ?? null,
      event.userAgent ?? null,
      JSON.stringify(event.metadata ?? {}),
    ],
  );
}
