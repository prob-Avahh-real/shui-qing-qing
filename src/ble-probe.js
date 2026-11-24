import {
  ADVERTISE_PREFIX,
  UUIDS,
  CMD,
  parseTelemetryPayload,
  parseStatusPayload,
} from './protocol.js';

/**
 * Web Bluetooth client for ShuiQingQing ESP32 water probe.
 */
export function createBleProbe(handlers = {}) {
  let device = null;
  let server = null;
  let controlChar = null;
  let connected = false;

  function setConnected(v) {
    connected = v;
    handlers.onConnection?.(v, device?.name || null);
  }

  function onTelemetryNotify(event) {
    const value = event.target.value;
    if (!value) return;
    const reading = parseTelemetryPayload(value);
    if (reading) handlers.onTelemetry?.(reading);
  }

  function onStatusNotify(event) {
    const value = event.target.value;
    if (!value) return;
    const status = parseStatusPayload(value);
    if (status) handlers.onStatus?.(status);
  }

  function onDisconnected() {
    controlChar = null;
    server = null;
    setConnected(false);
  }

  async function connect() {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth 不可用（请用 Chrome / Android Capacitor）');
    }
    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: ADVERTISE_PREFIX }],
      optionalServices: [UUIDS.service],
    });
    device.addEventListener('gattserverdisconnected', onDisconnected);
    server = await device.gatt.connect();
    const service = await server.getPrimaryService(UUIDS.service);

    const statusChar = await service.getCharacteristic(UUIDS.status);
    await statusChar.startNotifications();
    statusChar.addEventListener('characteristicvaluechanged', onStatusNotify);

    const telemetryChar = await service.getCharacteristic(UUIDS.telemetry);
    await telemetryChar.startNotifications();
    telemetryChar.addEventListener('characteristicvaluechanged', onTelemetryNotify);

    controlChar = await service.getCharacteristic(UUIDS.control);
    setConnected(true);
    await sendCommand(CMD.REQUEST_STATUS);
    return device.name;
  }

  async function sendCommand(cmd, payload = []) {
    if (!controlChar) throw new Error('未连接探针');
    const body = new Uint8Array([cmd, ...payload]);
    await controlChar.writeValueWithoutResponse(body);
  }

  async function requestMeasure() {
    await sendCommand(CMD.REQUEST_MEASURE);
  }

  async function ping() {
    await sendCommand(CMD.PING);
  }

  async function disconnect() {
    try {
      if (device?.gatt?.connected) device.gatt.disconnect();
    } catch {
      /* ignore */
    }
    onDisconnected();
  }

  return {
    connect,
    disconnect,
    requestMeasure,
    ping,
    get connected() {
      return connected;
    },
    get deviceName() {
      return device?.name || null;
    },
  };
}
