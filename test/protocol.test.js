const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseTelemetryPayload, EVT } = require('../src/protocol.cjs.js');
const { assessReading } = require('../src/assess.cjs.js');
const { addReading, normalizeReading } = require('../src/store.cjs.js');

describe('protocol', () => {
  it('parses telemetry frame', () => {
    const buf = new ArrayBuffer(11);
    const view = new DataView(buf);
    view.setUint8(0, EVT.TELEMETRY);
    view.setUint16(1, 720, true); // pH 7.20
    view.setUint16(3, 85, true); // TDS
    view.setUint16(5, 2250, true); // 22.50°C
    view.setUint16(7, 3, true); // turbidity 0.3
    view.setUint8(9, 0x08); // compensated
    view.setUint8(10, 42);
    const r = parseTelemetryPayload(view);
    assert.equal(r.ph, 7.2);
    assert.equal(r.tds, 85);
    assert.equal(r.tempC, 22.5);
    assert.equal(r.turbidity, 0.3);
    assert.equal(r.compensated, true);
    assert.equal(r.seq, 42);
  });

  it('parses raw 10-byte frame without event prefix', () => {
    const buf = new ArrayBuffer(10);
    const view = new DataView(buf);
    view.setUint16(0, 680, true);
    view.setUint16(2, 320, true);
    view.setUint16(4, 2410, true);
    view.setUint16(6, 12, true);
    view.setUint8(8, 0);
    view.setUint8(9, 1);
    const r = parseTelemetryPayload(view);
    assert.equal(r.ph, 6.8);
    assert.equal(r.tds, 320);
  });
});

describe('assess', () => {
  it('grades good drinking water as A', () => {
    const r = assessReading(
      { ph: 7.2, tds: 85, tempC: 22.5, turbidity: 0.3 },
      'drinking'
    );
    assert.equal(r.grade, 'A');
    assert.equal(r.pass, true);
    assert.ok(r.score >= 90);
  });

  it('flags bad drinking water', () => {
    const r = assessReading(
      { ph: 5.5, tds: 800, tempC: 22, turbidity: 3.0 },
      'drinking'
    );
    assert.equal(r.grade, 'F');
    assert.equal(r.pass, false);
  });
});

describe('store', () => {
  it('normalizes and adds readings', () => {
    const mem = new Map();
    const storage = {
      getItem: (k) => mem.get(k) || null,
      setItem: (k, v) => mem.set(k, v),
    };
    let list = [];
    const rec = normalizeReading({
      ph: 7.0,
      tds: 100,
      tempC: 20,
      turbidity: 0.5,
      sceneId: 'drinking',
      score: 88,
      grade: 'B',
    });
    assert.ok(rec.id);
    list = addReading(list, rec);
    assert.equal(list.length, 1);
  });
});
