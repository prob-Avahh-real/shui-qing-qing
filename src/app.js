import { SCENES } from './standards.js';
import { assessReading, formatMetric } from './assess.js';
import {
  loadReadings,
  saveReadings,
  addReading,
  removeReading,
  loadSettings,
  saveSettings,
  uid,
} from './store.js';
import { DEMO_READINGS } from './protocol.js';
import { createBleProbe } from './ble-probe.js';
import { createWearableInput } from './wearable-input.js';

const $ = (id) => document.getElementById(id);

let readings = loadReadings();
let settings = loadSettings();
let currentReading = null;
let currentAssessment = null;
let demoIndex = 0;
let measuring = false;

const statusEl = $('status');

function setStatus(msg) {
  statusEl.textContent = msg || '';
}

function persist() {
  readings = saveReadings(readings);
  saveSettings(settings);
}

function scene() {
  return SCENES.find((s) => s.id === settings.sceneId) || SCENES[0];
}

function cycleScene(delta) {
  const idx = SCENES.findIndex((s) => s.id === settings.sceneId);
  const next = SCENES[(idx + delta + SCENES.length) % SCENES.length];
  settings.sceneId = next.id;
  saveSettings(settings);
  $('scene-select').value = next.id;
  if (currentReading) applyAssessment();
  renderSceneTabs();
  setStatus(`场景：${next.name}`);
}

function applyAssessment() {
  if (!currentReading) {
    currentAssessment = null;
    return;
  }
  currentAssessment = assessReading(currentReading, settings.sceneId);
}

function renderSceneTabs() {
  const tabs = $('scene-tabs');
  tabs.innerHTML = '';
  for (const s of SCENES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scene-tab' + (s.id === settings.sceneId ? ' active' : '');
    btn.textContent = `${s.icon} ${s.name}`;
    btn.addEventListener('click', () => {
      settings.sceneId = s.id;
      $('scene-select').value = s.id;
      saveSettings(settings);
      if (currentReading) {
        applyAssessment();
        renderDashboard();
      }
      renderSceneTabs();
    });
    tabs.appendChild(btn);
  }
}

function renderDashboard() {
  const assess = currentAssessment;
  const reading = currentReading;

  if (!reading || !assess) {
    $('grade-badge').textContent = '—';
    $('grade-badge').style.background = 'var(--ink-soft)';
    $('score-value').textContent = '—';
    $('quality-banner').className = 'quality-banner hidden';
    for (const key of ['ph', 'tds', 'tempC', 'turbidity']) {
      $(`metric-${key}`).textContent = '—';
      $(`metric-${key}`).closest('.metric').classList.remove('warn', 'bad');
    }
    $('advice-text').textContent = '浸没探针后点击「检测」，无硬件时使用模拟数据。';
    return;
  }

  const g = assess.gradeInfo;
  $('grade-badge').textContent = assess.grade;
  $('grade-badge').style.background = g.color;
  $('score-value').textContent = String(assess.score);
  $('grade-label').textContent = g.label;

  const banner = $('quality-banner');
  banner.classList.remove('hidden', 'ok', 'warn', 'bad');
  if (assess.grade === 'A' || assess.grade === 'B') {
    banner.classList.add('ok');
    banner.textContent = `✓ ${assess.sceneName} · ${g.label}`;
  } else if (assess.grade === 'C') {
    banner.classList.add('warn');
    banner.textContent = `⚠ ${assess.sceneName} · 临界，建议复测`;
  } else {
    banner.classList.add('bad');
    banner.textContent = `✗ ${assess.sceneName} · 不合格`;
  }

  for (const c of assess.checks) {
    const el = $(`metric-${c.id}`);
    if (!el) continue;
    el.textContent = formatMetric(c.id, c.value) + (c.unit ? ` ${c.unit}` : '');
    const card = el.closest('.metric');
    card.classList.remove('warn', 'bad');
    if (!c.ok) card.classList.add(c.score < 40 ? 'bad' : 'warn');
  }

  const warnBits = [...(assess.warnings || [])];
  $('advice-text').textContent = warnBits.length
    ? `${assess.advice}（${warnBits.join('、')}）`
    : assess.advice;
}

function renderHistory() {
  const ul = $('history-list');
  const empty = $('history-empty');
  ul.innerHTML = '';
  if (!readings.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  for (const r of readings.slice(0, 30)) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'history-item';
    const sc = SCENES.find((s) => s.id === r.sceneId);
    const time = new Date(r.createdAt).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    btn.innerHTML = `
      <span class="hist-grade" style="background:${gradeColor(r.grade)}">${r.grade || '—'}</span>
      <span class="hist-body">
        <span class="hist-title">${sc?.icon || '💧'} ${sc?.name || r.sceneId} · pH ${r.ph?.toFixed(2) ?? '—'}</span>
        <span class="hist-sub">TDS ${r.tds ?? '—'} ppm · ${time}</span>
      </span>
      <span class="hist-score">${r.score ?? '—'}</span>
    `;
    btn.addEventListener('click', () => {
      currentReading = { ...r };
      applyAssessment();
      renderDashboard();
      setStatus('已载入历史记录');
    });
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

function gradeColor(grade) {
  const map = { A: '#0d6e8a', B: '#1a8f6e', C: '#c47a00', F: '#c0392b' };
  return map[grade] || '#6a8a9a';
}

function handleTelemetry(raw) {
  currentReading = { ...raw, sceneId: settings.sceneId };
  applyAssessment();
  renderDashboard();
  measuring = false;
  $('btn-measure').disabled = false;
  $('btn-measure').textContent = '检测';
  setStatus('检测完成');
}

function saveCurrentReading() {
  if (!currentReading || !currentAssessment) {
    setStatus('请先完成检测');
    return;
  }
  const record = {
    id: uid(),
    ...currentReading,
    sceneId: settings.sceneId,
    score: currentAssessment.score,
    grade: currentAssessment.grade,
    createdAt: Date.now(),
  };
  readings = addReading(readings, record);
  persist();
  renderHistory();
  setStatus(`已保存 · ${currentAssessment.grade} 级 ${currentAssessment.score} 分`);
}

function simulateMeasure() {
  if (measuring) return;
  measuring = true;
  $('btn-measure').disabled = true;
  $('btn-measure').textContent = '检测中…';
  setStatus('模拟采样…');
  const base = DEMO_READINGS[demoIndex % DEMO_READINGS.length];
  demoIndex += 1;
  setTimeout(() => {
    handleTelemetry({
      ph: base.ph + (Math.random() - 0.5) * 0.15,
      tds: Math.round(base.tds + (Math.random() - 0.5) * 20),
      tempC: base.tempC + (Math.random() - 0.5) * 0.8,
      turbidity: Math.max(0, base.turbidity + (Math.random() - 0.5) * 0.2),
      probeDry: false,
      calNeeded: false,
      lowBattery: false,
      compensated: true,
      updatedAt: Date.now(),
    });
  }, 900);
}

async function measure() {
  if (measuring) return;
  if (probe.connected) {
    try {
      measuring = true;
      $('btn-measure').disabled = true;
      $('btn-measure').textContent = '检测中…';
      setStatus('探针采样…');
      await probe.requestMeasure();
    } catch (e) {
      measuring = false;
      $('btn-measure').disabled = false;
      $('btn-measure').textContent = '检测';
      setStatus(e.message || '检测失败');
    }
    return;
  }
  simulateMeasure();
}

const probe = createBleProbe({
  onConnection(ok, name) {
    setStatus(ok ? `已连接 ${name || '探针'}` : '探针已断开');
    $('btn-connect').textContent = ok ? '已连' : 'BLE';
  },
  onTelemetry(reading) {
    handleTelemetry(reading);
  },
  onStatus(status) {
    if (status?.lowBattery) setStatus('探针电量低');
  },
});

async function connectBle() {
  if (probe.connected) {
    await probe.disconnect();
    return;
  }
  try {
    setStatus('选择 ShuiQingQing 探针…');
    await probe.connect();
  } catch (e) {
    setStatus(e.message || '连接失败，将使用模拟检测');
  }
}

const wearables = createWearableInput({
  onRingTiltLeft: () => cycleScene(-1),
  onRingTiltRight: () => cycleScene(1),
  onRingShake: () => measure(),
  onCaneTap: () => saveCurrentReading(),
});

async function enableWearable(kind) {
  const ok = await wearables.requestPermission();
  if (!ok) {
    setStatus('需要运动/方向传感器权限');
    return;
  }
  wearables.start();
  if (kind === 'ring') {
    $('ring-badge').classList.add('on');
    $('ring-badge').textContent = '戒指 · 已连接';
  } else {
    $('cane-badge').classList.add('on');
    $('cane-badge').textContent = '手杖 · 已连接';
  }
  setStatus('穿戴输入已启用');
}

$('btn-measure').addEventListener('click', () => measure());
$('btn-save').addEventListener('click', () => saveCurrentReading());
$('btn-connect').addEventListener('click', () => connectBle());
$('scene-select').addEventListener('change', (e) => {
  settings.sceneId = e.target.value;
  saveSettings(settings);
  if (currentReading) {
    applyAssessment();
    renderDashboard();
  }
  renderSceneTabs();
});

$('btn-clear-history').addEventListener('click', () => {
  if (!readings.length) return;
  if (!confirm('清空全部检测记录？')) return;
  readings = [];
  persist();
  renderHistory();
  setStatus('记录已清空');
});

$('ring-badge').addEventListener('click', () => enableWearable('ring'), { once: true });
$('cane-badge').addEventListener('click', () => enableWearable('cane'), { once: true });

$('scene-select').value = settings.sceneId;
renderSceneTabs();
renderDashboard();
renderHistory();
setStatus('就绪 · 无探针时「检测」走模拟');
