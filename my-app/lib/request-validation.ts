export const DEFAULT_TENANT_ID = 'acme_corp';

const TENANT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function parseTenantId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_TENANT_ID;
  }

  if (typeof value !== 'string' || !TENANT_ID_PATTERN.test(value)) {
    return null;
  }

  return value;
}

export function parseBoundedInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (value === null || value.trim() === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, minimum), maximum);
}

export function isText(value: unknown, maximumLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximumLength;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
