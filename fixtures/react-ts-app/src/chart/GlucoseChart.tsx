import { ChartTooltip } from "./ChartTooltip";
import { useGlucoseSeries } from "./useGlucoseSeries";

export function GlucoseChart(): string[] {
  const points = useGlucoseSeries();
  return points.map((point) => ChartTooltip({ point }));
}
