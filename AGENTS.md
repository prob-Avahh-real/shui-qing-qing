# shui-qing-qing

水清清 · 水质检测专用 移动端 + ESP32 探针的水质快检应用。支持 pH、TDS、水温、浊度四项指标，按场景（饮用水 / 泳池 / 水族）对照国标评分。 功能 - **三项场景**：饮用水（GB 5749）、泳池/浴池、水族/养殖 - **四项指标**：pH、TDS、水温、浊度 → A–F 评分与建议 - **BLE 探针**：广播名 `ShuiQingQing-XXXX`，Web Bluetooth 连接 - **模拟检测**：无硬件时一键模拟采样

## 用途与 Target 判定

水质快检：App + ESP32 探针

- 移动端：需要
- 智能硬件：需要

## 目标平台

| 平台 | 方式 | 产出 |
|------|------|------|
| 🤖 Android | Capacitor → Gradle | APK |
| 🍎 iOS | Capacitor（若已加 ios/） | IPA |
| ⌚ 手表 | 窄屏 `@media (max-width:280px)` 等 | 同 App |
| 💍 智能戒指 | DeviceOrientation | 见实现 |
| 🦯 智能手杖 | DeviceMotion | 见实现 |

## 技术栈信号

- 检测到：android, capacitor, firmware, node

## 命令

```bash
npm install
npm test
npm run build
npm run sync:android
```

## 同步说明

改 Web 源码后执行 `npm run build`（或 `build:web`），再 `npx cap sync android`。打 APK 建议使用 **JDK 17**（`JAVA_HOME` 指向 openjdk@17）。

## 智能硬件约定

- 戒指：DeviceOrientation（倾斜/摇动），注意 iOS 权限需在用户手势内请求
- 手杖：DeviceMotion（加速度尖峰=轻点，摆动=方向）
- 手表：`@media (max-width: 280px), (max-height: 300px)`
- 优先复用兄弟项目的 `wearable-input.js` / `air-shared`，避免再复制漂移

## 助手约束

- Loop：先定可验证 Done 与停止条件；每切片过验证环；失败回灌；详见 docs/LOOP_ENGINEERING.md
- Harness：遵循根 AGENTS「Harness Engineering」；Guide=本文件，Sensor=测试/CI；同类失误二次须沉淀规则或测试（棘轮）。详见 docs/HARNESS_ENGINEERING.md
- 遵循仓库根 `AGENTS.md`：通用性/扩展性、分阶段里程碑、默认双 Target（**仅当用途适合**）
- 可选 Target 未做时可搁置；不要为不适用形态硬加 APK/穿戴
- 改动保持聚焦；公共逻辑抽到 shared/`tools/`，禁止静默失败

## 验证环 / Done

```bash
npm install
npm test          # 若有
npm run build     # 或 build:web
npx cap sync android   # 若有 android/
# 可选：JAVA_HOME=…/openjdk@17 npm run apk:debug
```

**Done 示例**：测试通过（若有）+ web 产物进 `www/`/`dist/` + `cap sync` 无报错。可选穿戴未做可搁置，不纳入强制 Done。
