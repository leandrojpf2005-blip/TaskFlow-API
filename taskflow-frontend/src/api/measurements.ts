// Measurements API.
//   GET  /measurements -> Measurement[]  (full history, append-only)
//   POST /measurements -> Measurement    (logs a new dated row)

import { request } from "./client";
import type { Measurement, NewMeasurement } from "../types/measurements";

export function getMeasurements(): Promise<Measurement[]> {
  return request<Measurement[]>("/measurements");
}

export function createMeasurement(input: NewMeasurement): Promise<Measurement> {
  return request<Measurement>("/measurements", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
