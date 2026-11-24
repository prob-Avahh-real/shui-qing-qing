/** CommonJS mirror of standards.js for node:test */

const GRADES = {
  A: { label: '优质', minScore: 90, color: '#0d6e8a' },
  B: { label: '合格', minScore: 75, color: '#1a8f6e' },
  C: { label: '临界', minScore: 60, color: '#c47a00' },
  F: { label: '不合格', minScore: 0, color: '#c0392b' },
};

const SCENES = [
  {
    id: 'drinking',
    name: '饮用水',
    limits: {
      ph: { min: 6.5, max: 8.5, weight: 25 },
      tds: { max: 500, weight: 25 },
      turbidity: { max: 1.0, weight: 30 },
      tempC: { min: 5, max: 35, weight: 10 },
    },
  },
  {
    id: 'pool',
    name: '泳池/浴池',
    limits: {
      ph: { min: 7.0, max: 7.8, weight: 30 },
      tds: { max: 1000, weight: 15 },
      turbidity: { max: 0.5, weight: 35 },
      tempC: { min: 20, max: 34, weight: 10 },
    },
  },
  {
    id: 'aquarium',
    name: '水族/养殖',
    limits: {
      ph: { min: 6.5, max: 8.5, weight: 25 },
      tds: { max: 800, weight: 20 },
      turbidity: { max: 5.0, weight: 25 },
      tempC: { min: 18, max: 30, weight: 20 },
    },
  },
];

function getScene(id) {
  return SCENES.find((s) => s.id === id) || SCENES[0];
}

function scoreToGrade(score) {
  if (score >= GRADES.A.minScore) return 'A';
  if (score >= GRADES.B.minScore) return 'B';
  if (score >= GRADES.C.minScore) return 'C';
  return 'F';
}

module.exports = { GRADES, SCENES, getScene, scoreToGrade };
