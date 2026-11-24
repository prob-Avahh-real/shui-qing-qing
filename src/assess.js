import { GRADES, getScene, scoreToGrade } from './standards.js';

function scoreMetric(value, spec) {
  if (value == null || !Number.isFinite(value)) return { score: 0, ok: false, note: '无数据' };
  const { min, max, weight } = spec;
  let ok = true;
  let score = 100;

  if (min != null && value < min) {
    ok = false;
    const gap = min - value;
    score = Math.max(0, 100 - gap * 40);
  }
  if (max != null && value > max) {
    ok = false;
    const gap = value - max;
    score = Math.max(0, 100 - gap * (max < 10 ? 30 : 0.15));
  }

  return { score, ok, weight: weight || 10, note: ok ? '正常' : '超限' };
}

/**
 * Assess a water reading against a scene's limits.
 * Returns { score, grade, gradeInfo, checks, pass, advice }
 */
export function assessReading(reading, sceneId = 'drinking') {
  const scene = getScene(sceneId);
  const limits = scene.limits;
  const checks = [];

  for (const [key, spec] of Object.entries(limits)) {
    const value = reading[key];
    const result = scoreMetric(value, spec);
    checks.push({
      id: key,
      label: metricLabel(key),
      value,
      unit: metricUnit(key),
      ok: result.ok,
      note: result.note,
      weight: result.weight,
      score: result.score,
    });
  }

  let totalWeight = 0;
  let weighted = 0;
  for (const c of checks) {
    totalWeight += c.weight;
    weighted += c.score * c.weight;
  }
  const score = totalWeight ? Math.round(weighted / totalWeight) : 0;
  const grade = scoreToGrade(score);
  const gradeInfo = GRADES[grade];
  const pass = grade !== 'F';
  const advice =
    grade === 'A' || grade === 'B'
      ? scene.advice.good
      : grade === 'C'
        ? scene.advice.warn
        : scene.advice.bad;

  const warnings = [];
  if (reading.probeDry) warnings.push('探头未浸没');
  if (reading.calNeeded) warnings.push('需要校准');
  if (reading.lowBattery) warnings.push('探针电量低');

  return {
    sceneId: scene.id,
    sceneName: scene.name,
    score,
    grade,
    gradeInfo,
    checks,
    pass,
    advice,
    warnings,
    gbRefs: scene.gbRefs,
  };
}

function metricLabel(key) {
  const map = {
    ph: 'pH 酸碱度',
    tds: 'TDS 溶解性固体',
    turbidity: '浊度',
    tempC: '水温',
  };
  return map[key] || key;
}

function metricUnit(key) {
  const map = {
    ph: '',
    tds: 'ppm',
    turbidity: 'NTU',
    tempC: '℃',
  };
  return map[key] || '';
}

export function formatMetric(key, value) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (key === 'ph') return value.toFixed(2);
  if (key === 'tempC') return value.toFixed(1);
  if (key === 'turbidity') return value.toFixed(1);
  return String(Math.round(value));
}
