/** CommonJS mirror of assess.js for node:test */
const { GRADES, getScene, scoreToGrade } = require('./standards.cjs.js');

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

function assessReading(reading, sceneId = 'drinking') {
  const scene = getScene(sceneId);
  const limits = scene.limits;
  const checks = [];
  for (const [key, spec] of Object.entries(limits)) {
    const value = reading[key];
    const result = scoreMetric(value, spec);
    checks.push({
      id: key,
      value,
      ok: result.ok,
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
  return { score, grade, pass: grade !== 'F', sceneId: scene.id };
}

module.exports = { assessReading };
