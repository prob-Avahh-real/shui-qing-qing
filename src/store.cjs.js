/** CommonJS mirror of store.js for node:test */

const STORAGE_KEY = 'shuiqingqing.readings.v1';

function uid() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeReading(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const ph = raw.ph == null ? null : Number(raw.ph);
  const tds = raw.tds == null ? null : Number(raw.tds);
  const tempC = raw.tempC == null ? null : Number(raw.tempC);
  const turbidity = raw.turbidity == null ? null : Number(raw.turbidity);
  if (![ph, tds, tempC, turbidity].some((v) => Number.isFinite(v))) return null;
  return {
    id: String(raw.id || uid()),
    ph: Number.isFinite(ph) ? ph : null,
    tds: Number.isFinite(tds) ? tds : null,
    tempC: Number.isFinite(tempC) ? tempC : null,
    turbidity: Number.isFinite(turbidity) ? turbidity : null,
    sceneId: String(raw.sceneId || 'drinking'),
    score: raw.score == null ? null : Number(raw.score),
    grade: raw.grade || null,
    createdAt: Number(raw.createdAt) || Date.now(),
  };
}

function loadReadings(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(normalizeReading).filter(Boolean);
  } catch {
    return [];
  }
}

function saveReadings(readings, storage) {
  const cleaned = (readings || []).map(normalizeReading).filter(Boolean);
  storage?.setItem?.(STORAGE_KEY, JSON.stringify(cleaned));
  return cleaned;
}

function addReading(readings, reading) {
  const next = normalizeReading(reading);
  if (!next) return readings.slice();
  return [next, ...readings].slice(0, 200);
}

module.exports = { normalizeReading, loadReadings, saveReadings, addReading, uid };
