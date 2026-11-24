/** CommonJS mirror of protocol.js for node:test */

const EVT = {
  STATUS: 0x80,
  TELEMETRY: 0x81,
  PONG: 0x85,
  ERROR: 0x8f,
};

const FLAGS = {
  CAL_NEEDED: 0x01,
  PROBE_DRY: 0x02,
  LOW_BATTERY: 0x04,
  COMPENSATED: 0x08,
};

function parseTelemetryPayload(dataView) {
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

module.exports = { EVT, FLAGS, parseTelemetryPayload };
