export const STORAGE_KEY = 'shuiqingqing.readings.v1';
export const SETTINGS_KEY = 'shuiqingqing.settings.v1';

function uid() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeReading(raw) {
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
    label: String(raw.label || '').trim(),
    score: raw.score == null ? null : Number(raw.score),
    grade: raw.grade || null,
    flags: Number(raw.flags) || 0,
    probeDry: Boolean(raw.probeDry),
    calNeeded: Boolean(raw.calNeeded),
    lowBattery: Boolean(raw.lowBattery),
    createdAt: Number(raw.createdAt) || Date.now(),
  };
}

export function loadReadings(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeReading).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveReadings(readings, storage = globalThis.localStorage) {
  const cleaned = (readings || []).map(normalizeReading).filter(Boolean);
  storage?.setItem?.(STORAGE_KEY, JSON.stringify(cleaned));
  return cleaned;
}

export function addReading(readings, reading) {
  const next = normalizeReading(reading);
  if (!next) return readings.slice();
  return [next, ...readings.filter((r) => r.id !== next.id)].slice(0, 200);
}

export function removeReading(readings, id) {
  return readings.filter((r) => r.id !== id);
}

export function loadSettings(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(SETTINGS_KEY);
    if (!raw) return { sceneId: 'drinking' };
    const parsed = JSON.parse(raw);
    return { sceneId: parsed.sceneId || 'drinking' };
  } catch {
    return { sceneId: 'drinking' };
  }
}

export function saveSettings(settings, storage = globalThis.localStorage) {
  storage?.setItem?.(SETTINGS_KEY, JSON.stringify({ sceneId: settings.sceneId || 'drinking' }));
  return settings;
}

export { uid };
