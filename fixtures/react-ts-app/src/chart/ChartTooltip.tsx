import type { GlucosePoint } from "./useGlucoseSeries";

const cachedByMinute = new Map<number, string>();

export type ChartTooltipProps = {
  point: GlucosePoint;
};

export function formatTooltipValue(point: GlucosePoint): string {
  const cached = cachedByMinute.get(point.minute);
  if (cached) return cached;
  const value = `${point.value} mg/dL`;
  cachedByMinute.set(point.minute, value);
  return value;
}

export function resetTooltipCache(): void {
  cachedByMinute.clear();
}

export function ChartTooltip({ point }: ChartTooltipProps): string {
  return `Glucose ${formatTooltipValue(point)}`;
}
