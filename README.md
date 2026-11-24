# 水清清 · 水质检测专用

移动端 + ESP32 探针的水质快检应用。支持 pH、TDS、水温、浊度四项指标，按场景（饮用水 / 泳池 / 水族）对照国标评分。

## 功能

- **三项场景**：饮用水（GB 5749）、泳池/浴池、水族/养殖
- **四项指标**：pH、TDS、水温、浊度 → A–F 评分与建议
- **BLE 探针**：广播名 `ShuiQingQing-XXXX`，Web Bluetooth 连接
- **模拟检测**：无硬件时一键模拟采样
- **检测记录**：本地保存历史，可回看
- **穿戴输入**：戒指倾斜换场景、甩动检测；手杖敲击保存
- **手表布局**：`@media (max-width: 280px)` 紧凑 UI

## 快速开始

```bash
cd active/shui-qing-qing
npm install
npm run build
npm test
```

浏览器调试：用静态服务打开 `www/index.html`（或 `npx serve www`）。

## 移动端打包

```bash
npx cap add android   # 首次
npm run sync:android
cd android && ./gradlew assembleDebug
```

## BLE 协议

见 `protocol/shui-qing-qing.json`。遥测帧 10 字节：

```
pH×100 (u16 LE) | TDS (u16 LE) | temp×100 (u16 LE) | turbidity×10 (u16 LE) | flags (u8) | seq (u8)
```

命令：`REQUEST_STATUS=1`，`REQUEST_MEASURE=2`，`PING=5`

## 固件

`firmware/` 含 ESP32 PlatformIO 探针模拟器（与 App 协议对齐）。烧录：

```bash
cd firmware && pio run -t upload
```

## 项目关系

- 脚手架：`chipmate`（Capacitor + esbuild）
- 评分 UX：`shihaohao`
- 传感器帧：`chipnest-hub`
- 协议测试：`voice-brooch`
