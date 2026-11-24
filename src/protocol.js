/** Shared BLE protocol for ShuiQingQing water probe. */

export const ADVERTISE_PREFIX = 'ShuiQingQing-';

export const UUIDS = {
  service: 'c020a100-0001-4000-8000-000000c02001',
  status: 'c020a101-0001-4000-8000-000000c02001',
  telemetry: 'c020a102-0001-4000-8000-000000c02001',
  control: 'c020a103-0001-4000-8000-000000c02001',
};

export const CMD = {
  REQUEST_STATUS: 0x01,
  REQUEST_MEASURE: 0x02,
  PING: 0x05,
};

export const EVT = {
  STATUS: 0x80,
  TELEMETRY: 0x81,
  PONG: 0x85,
  ERROR: 0x8f,
};

export const FLAGS = {
  CAL_NEEDED: 0x01,
  PROBE_DRY: 0x02,
  LOW_BATTERY: 0x04,
  COMPENSATED: 0x08,
};

/** Parse telemetry notify: pH×100, TDS, temp×100, turbidity×10, flags, seq */
export function parseTelemetryPayload(dataView) {
  if (!dataView || dataView.byteLength < 10) return null;
  let offset = 0;
  if (dataView.byteLength >= 11 && dataView.getUint8(0) === EVT.TELEMETRY) {
    offset = 1;
  }
  if (dataView.byteLength - offset < 10) return null;
  const phCenti = dataView.getUint16(offset, true);
  const tds = dataView.getUint16(offset + 2, true);
  const tempCenti = dataView.getUint16(offset + 4, true);
  const turbidityTenth = dataView.getUint16(offset + 6, true);
  const flags = dataView.getUint8(offset + 8);
  const seq = dataView.getUint8(offset + 9);
  return {
    ph: phCenti / 100,
    tds,
    tempC: tempCenti / 100,
    turbidity: turbidityTenth / 10,
    flags,
    seq,
    calNeeded: Boolean(flags & FLAGS.CAL_NEEDED),
    probeDry: Boolean(flags & FLAGS.PROBE_DRY),
    lowBattery: Boolean(flags & FLAGS.LOW_BATTERY),
    compensated: Boolean(flags & FLAGS.COMPENSATED),
    updatedAt: Date.now(),
  };
}

export function parseStatusPayload(dataView) {
  if (!dataView || dataView.byteLength < 3) return null;
  let offset = 0;
  if (dataView.getUint8(0) === EVT.STATUS) offset = 1;
  if (dataView.byteLength - offset < 2) return null;
  return {
    batteryPct: dataView.getUint8(offset),
    ready: dataView.getUint8(offset + 1) === 1,
  };
}

/** Demo readings for simulation */
export const DEMO_READINGS = [
  { ph: 7.2, tds: 85, tempC: 22.5, turbidity: 0.3 },
  { ph: 6.8, tds: 320, tempC: 24.1, turbidity: 1.2 },
  { ph: 8.1, tds: 450, tempC: 28.0, turbidity: 2.5 },
];
