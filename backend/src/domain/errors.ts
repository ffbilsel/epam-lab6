/**
 * RFC 7807 problem details base class plus typed concrete errors.
 * Each concrete error maps to an HTTP status and a stable `type` URI.
 */
export class DomainError extends Error {
  /** RFC 7807 type URI. */
  public readonly type: string;
  /** RFC 7807 short title. */
  public readonly title: string;
  /** HTTP status code. */
  public readonly status: number;
  /** Optional machine-readable code for client switching. */
  public readonly code?: string;
  /** Optional structured details. */
  public readonly details?: Readonly<Record<string, unknown>>;

  /**
   * @param opts Error fields.
   */
  public constructor(opts: {
    type: string;
    title: string;
    status: number;
    detail?: string;
    code?: string;
    details?: Record<string, unknown>;
  }) {
    super(opts.detail ?? opts.title);
    this.name = new.target.name;
    this.type = opts.type;
    this.title = opts.title;
    this.status = opts.status;
    if (opts.code !== undefined) this.code = opts.code;
    if (opts.details !== undefined) this.details = Object.freeze({ ...opts.details });
  }
}

/** 400 Validation. */
export class ValidationError extends DomainError {
  /** @param detail Human-readable detail. @param details Field-level details. */
  public constructor(detail: string, details?: Record<string, unknown>) {
    super({
      type: 'https://example.com/problems/validation',
      title: 'Invalid request',
      status: 400,
      detail,
      ...(details !== undefined ? { details } : {}),
    });
  }
}

/** 401 Unauthorized. */
export class UnauthorizedError extends DomainError {
  /** @param detail Human-readable detail. @param code Optional machine code. */
  public constructor(detail = 'Authentication failed', code?: string) {
    super({
      type: 'https://example.com/problems/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail,
      ...(code !== undefined ? { code } : {}),
    });
  }
}

/** 423 Locked. */
export class LockedError extends DomainError {
  /** @param detail Human-readable detail. @param retryAfterSeconds Seconds until unlock. */
  public constructor(detail = 'Account temporarily locked', retryAfterSeconds?: number) {
    super({
      type: 'https://example.com/problems/locked',
      title: 'Locked',
      status: 423,
      detail,
      ...(retryAfterSeconds !== undefined ? { details: { retryAfterSeconds } } : {}),
    });
  }
}

/** 410 Gone (expired/used token). */
export class GoneError extends DomainError {
  /** @param detail Human-readable detail. */
  public constructor(detail = 'Token expired or already used') {
    super({
      type: 'https://example.com/problems/gone',
      title: 'Gone',
      status: 410,
      detail,
    });
  }
}

/** 429 Too Many Requests. */
export class TooManyRequestsError extends DomainError {
  /** @param detail Human-readable detail. */
  public constructor(detail = 'Too many requests') {
    super({
      type: 'https://example.com/problems/too-many-requests',
      title: 'Too Many Requests',
      status: 429,
      detail,
    });
  }
}
