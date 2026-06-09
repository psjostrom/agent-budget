import { getSensorConnection } from "../sensor/sensorConnectionStore";

export type GlucosePoint = {
  minute: number;
  value: number;
  sensorGeneration: number;
};

export function useGlucoseSeries(): GlucosePoint[] {
  const connection = getSensorConnection();
  return [
    { minute: 0, value: 91 + connection.generation, sensorGeneration: connection.generation },
    { minute: 5, value: 96 + connection.generation, sensorGeneration: connection.generation },
    { minute: 10, value: 103 + connection.generation, sensorGeneration: connection.generation }
  ];
}
