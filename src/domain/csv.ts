export function quoteCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  const safe = /^[\u0000-\u0020\uFEFF]*[=+\-@]/u.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
