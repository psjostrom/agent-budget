export type SensorConnection = {
  id: string;
  connectedAt: number;
  generation: number;
};

let connection: SensorConnection = {
  id: "sensor-a",
  connectedAt: 1000,
  generation: 1
};

export function getSensorConnection(): SensorConnection {
  return connection;
}

export function reconnectSensor(id = "sensor-a"): SensorConnection {
  connection = {
    id,
    connectedAt: Date.now(),
    generation: connection.generation + 1
  };
  return connection;
}

export function resetSensorConnection(): void {
  connection = { id: "sensor-a", connectedAt: 1000, generation: 1 };
}
