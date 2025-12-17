export const CHICAGO_TZ = "America/Chicago";

const hasExplicitTz = (s: string) => /([+-]\d{2}:\d{2}|Z)$/.test(s);

export const toDateAssumingUtcIfNaive = (
  value: string | Date
): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && !hasExplicitTz(s)) {
    const d = new Date(`${s}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatChicago = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions
): string => {
  const d = toDateAssumingUtcIfNaive(value);
  if (!d) return typeof value === "string" ? value : "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    ...options,
  }).format(d);
};

