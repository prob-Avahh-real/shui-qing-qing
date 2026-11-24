/**
 * 水清清 — 水质标准库
 * 依据 GB 5749-2022（生活饮用水）、泳池及水族简化阈值
 */

export const GRADES = {
  A: { label: '优质', minScore: 90, color: '#0d6e8a' },
  B: { label: '合格', minScore: 75, color: '#1a8f6e' },
  C: { label: '临界', minScore: 60, color: '#c47a00' },
  F: { label: '不合格', minScore: 0, color: '#c0392b' },
};

export const SCENES = [
  {
    id: 'drinking',
    name: '饮用水',
    icon: '💧',
    gbRefs: ['GB 5749-2022'],
    limits: {
      ph: { min: 6.5, max: 8.5, weight: 25 },
      tds: { max: 500, weight: 25 },
      turbidity: { max: 1.0, weight: 30 },
      tempC: { min: 5, max: 35, weight: 10 },
    },
    advice: {
      good: '符合生活饮用水卫生标准，可放心饮用。',
      warn: '部分指标接近限值，建议过滤或静置后复测。',
      bad: '超出 GB 5749 限值，请勿直接饮用，联系供水部门或更换水源。',
    },
  },
  {
    id: 'pool',
    name: '泳池/浴池',
    icon: '🏊',
    gbRefs: ['CJ/T 244-2017', 'GB 37488-2019'],
    limits: {
      ph: { min: 7.0, max: 7.8, weight: 30 },
      tds: { max: 1000, weight: 15 },
      turbidity: { max: 0.5, weight: 35 },
      tempC: { min: 20, max: 34, weight: 10 },
    },
    advice: {
      good: '水质清澈，pH 与浊度在适宜范围。',
      warn: '建议调整消毒剂量或加强过滤循环。',
      bad: '水质不达标，暂停使用并处理消毒/过滤系统。',
    },
  },
  {
    id: 'aquarium',
    name: '水族/养殖',
    icon: '🐠',
    gbRefs: ['渔业水质标准 GB 11607-89'],
    limits: {
      ph: { min: 6.5, max: 8.5, weight: 25 },
      tds: { max: 800, weight: 20 },
      turbidity: { max: 5.0, weight: 25 },
      tempC: { min: 18, max: 30, weight: 20 },
    },
    advice: {
      good: '水体参数适合多数观赏鱼与淡水养殖。',
      warn: '注意换水频率与过滤维护，观察鱼类活动。',
      bad: '参数偏离养殖要求，需换水、调 pH 或增氧处理。',
    },
  },
];

export function getScene(id) {
  return SCENES.find((s) => s.id === id) || SCENES[0];
}

export function scoreToGrade(score) {
  if (score >= GRADES.A.minScore) return 'A';
  if (score >= GRADES.B.minScore) return 'B';
  if (score >= GRADES.C.minScore) return 'C';
  return 'F';
}
