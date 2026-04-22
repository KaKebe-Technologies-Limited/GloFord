/**
 * Minimal RFC-4180 CSV writer. Escapes quotes, wraps fields that contain
 * commas, quotes, or newlines. No external dep.
 */

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const first = rows[0];
  if (!first) return "";
  const headers = Object.keys(first);
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s =
      v instanceof Date
        ? v.toISOString()
        : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(","));
  return [headers.join(","), ...body].join("\r\n");
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
