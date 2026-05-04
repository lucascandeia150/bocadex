import { subDays, startOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type DayPoint = { label: string; date: Date; value: number; value2?: number };

export function buildDayBuckets(days = 7): DayPoint[] {
  return Array.from({ length: days }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), days - 1 - i));
    return { label: format(d, "EEE", { locale: ptBR }).slice(0, 3), date: d, value: 0 };
  });
}

export function fillBuckets<T>(buckets: DayPoint[], rows: T[], getDate: (r: T) => Date, getValue: (r: T) => number): DayPoint[] {
  return buckets.map((b) => {
    const v = rows
      .filter((r) => startOfDay(getDate(r)).getTime() === b.date.getTime())
      .reduce((s, r) => s + getValue(r), 0);
    return { ...b, value: Number(v.toFixed(2)) };
  });
}

/** Returns demo data when the real series is all-zero. Uses a deterministic curve so it doesn't jump on every render. */
export function withDemoFallback(points: DayPoint[], scale: number): { points: DayPoint[]; isDemo: boolean } {
  const total = points.reduce((s, p) => s + p.value, 0);
  if (total > 0) return { points, isDemo: false };
  const curve = [0.4, 0.6, 0.55, 0.8, 1.0, 0.9, 0.75];
  const demo = points.map((p, i) => ({ ...p, value: Number((curve[i % curve.length] * scale).toFixed(2)) }));
  return { points: demo, isDemo: true };
}

export const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });