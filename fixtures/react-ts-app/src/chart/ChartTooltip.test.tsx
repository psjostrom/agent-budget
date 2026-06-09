import { describe, expect, it, beforeEach } from "vitest";
import { formatTooltipValue, resetTooltipCache } from "./ChartTooltip";
import { reconnectSensor, resetSensorConnection } from "../sensor/sensorConnectionStore";
import { useGlucoseSeries } from "./useGlucoseSeries";

describe("ChartTooltip", () => {
  beforeEach(() => {
    resetSensorConnection();
    resetTooltipCache();
  });

  it("updates stale chart tooltip value after sensor reconnect", () => {
    const before = useGlucoseSeries()[0];
    expect(formatTooltipValue(before)).toBe("92 mg/dL");

    reconnectSensor();
    const after = useGlucoseSeries()[0];

    expect(formatTooltipValue(after)).toBe("93 mg/dL");
  });
});
