# Frontload Dossier

## Task

Fix stale chart tooltip value after sensor reconnect

## Budget

- Requested budget: 12000 chars
- Estimated token equivalent: 3000
- Generated at: 2026-06-09T12:33:22.215Z

## Related tests / commands

- `pnpm test ChartTooltip.test`
- `pnpm tsc --noEmit`

## Most relevant files

1. `src/chart/ChartTooltip.test.tsx`
   - score: 49
   - why: path match, import/export match, related test, dependency edge
   - symbols: none
   - related tests: src/chart/ChartTooltip.test.tsx
2. `src/chart/ChartTooltip.tsx`
   - score: 36
   - why: path match, related test, dependency edge
   - symbols: formatTooltipValue, resetTooltipCache, ChartTooltip, ChartTooltipProps
   - related tests: src/chart/ChartTooltip.test.tsx
3. `src/chart/useGlucoseSeries.ts`
   - score: 36
   - why: path match, import/export match, dependency edge
   - symbols: useGlucoseSeries, GlucosePoint
   - related tests: none
4. `src/chart/GlucoseChart.tsx`
   - score: 24
   - why: path match, dependency edge
   - symbols: GlucoseChart
   - related tests: none
5. `src/sensor/sensorConnectionStore.ts`
   - score: 24
   - why: path match, dependency edge
   - symbols: getSensorConnection, reconnectSensor, resetSensorConnection, SensorConnection
   - related tests: none

## Suggested read order

1. `src/chart/ChartTooltip.test.tsx`
2. `src/chart/ChartTooltip.tsx`
3. `src/chart/useGlucoseSeries.ts`
4. `src/chart/GlucoseChart.tsx`
5. `src/sensor/sensorConnectionStore.ts`

## Dependency notes

- `src/chart/ChartTooltip.test.tsx` imports `src/chart/ChartTooltip.tsx`
- `src/chart/ChartTooltip.test.tsx` imports `src/sensor/sensorConnectionStore.ts`
- `src/chart/ChartTooltip.test.tsx` imports `src/chart/useGlucoseSeries.ts`
- `src/chart/ChartTooltip.tsx` imports `src/chart/useGlucoseSeries.ts`
- `src/chart/GlucoseChart.tsx` imports `src/chart/ChartTooltip.tsx`
- `src/chart/GlucoseChart.tsx` imports `src/chart/useGlucoseSeries.ts`
- `src/chart/useGlucoseSeries.ts` imports `src/sensor/sensorConnectionStore.ts`

## Context limits

This dossier intentionally omits raw file contents. Use `fl_read_budgeted` for targeted reads.
