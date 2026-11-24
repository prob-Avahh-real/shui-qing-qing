/**
 * ShuiQingQing — ESP32 BLE water probe simulator
 * Broadcasts ShuiQingQing-XXXX, notifies pH/TDS/temp/turbidity.
 */
#include <Arduino.h>
#include <NimBLEDevice.h>
#include <esp_mac.h>

static const char *BLE_SERVICE = "c020a100-0001-4000-8000-000000c02001";
static const char *BLE_STATUS = "c020a101-0001-4000-8000-000000c02001";
static const char *BLE_TELEMETRY = "c020a102-0001-4000-8000-000000c02001";
static const char *BLE_CONTROL = "c020a103-0001-4000-8000-000000c02001";

static const uint8_t CMD_REQUEST_STATUS = 0x01;
static const uint8_t CMD_REQUEST_MEASURE = 0x02;
static const uint8_t CMD_PING = 0x05;

static const uint8_t EVT_STATUS = 0x80;
static const uint8_t EVT_TELEMETRY = 0x81;
static const uint8_t EVT_PONG = 0x85;

static const int BTN_PIN = 0;
static const int LED_PIN = 2;

NimBLECharacteristic *statusChar = nullptr;
NimBLECharacteristic *telemetryChar = nullptr;

float simPh = 7.2f;
uint16_t simTds = 85;
float simTemp = 22.5f;
float simTurb = 0.3f;
uint8_t batteryPct = 88;
uint8_t seq = 0;
bool lastBtn = true;

void notifyStatus() {
  if (!statusChar) return;
  uint8_t frame[4] = {EVT_STATUS, batteryPct, 1, 0};
  statusChar->setValue(frame, sizeof(frame));
  statusChar->notify();
}

void notifyTelemetry() {
  if (!telemetryChar) return;
  simPh += (random(-8, 9)) / 100.0f;
  if (simPh < 6.5f) simPh = 6.5f;
  if (simPh > 8.5f) simPh = 8.5f;
  int tds = static_cast<int>(simTds) + random(-5, 6);
  if (tds < 0) tds = 0;
  simTds = static_cast<uint16_t>(tds);
  simTemp += (random(-10, 11)) / 100.0f;
  simTurb = max(0.0f, simTurb + (random(-3, 4)) / 10.0f);

  uint16_t phCenti = static_cast<uint16_t>(simPh * 100);
  uint16_t tempCenti = static_cast<uint16_t>(simTemp * 100);
  uint16_t turbTenth = static_cast<uint16_t>(simTurb * 10);
  seq++;

  uint8_t frame[11];
  frame[0] = EVT_TELEMETRY;
  frame[1] = phCenti & 0xff;
  frame[2] = (phCenti >> 8) & 0xff;
  frame[3] = simTds & 0xff;
  frame[4] = (simTds >> 8) & 0xff;
  frame[5] = tempCenti & 0xff;
  frame[6] = (tempCenti >> 8) & 0xff;
  frame[7] = turbTenth & 0xff;
  frame[8] = (turbTenth >> 8) & 0xff;
  frame[9] = 0x08; // compensated
  frame[10] = seq;

  telemetryChar->setValue(frame, sizeof(frame));
  telemetryChar->notify();
  Serial.printf("[telemetry] pH=%.2f TDS=%u temp=%.1f turb=%.1f\n",
                simPh, simTds, simTemp, simTurb);
  digitalWrite(LED_PIN, HIGH);
  delay(60);
  digitalWrite(LED_PIN, LOW);
}

class ControlCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pCharacteristic) override {
    std::string value = pCharacteristic->getValue();
    if (value.empty()) return;
    uint8_t cmd = static_cast<uint8_t>(value[0]);
    switch (cmd) {
      case CMD_REQUEST_STATUS:
        notifyStatus();
        break;
      case CMD_REQUEST_MEASURE:
        notifyTelemetry();
        break;
      case CMD_PING: {
        uint8_t pong[2] = {EVT_PONG, 0};
        pCharacteristic->setValue(pong, 2);
        break;
      }
      default:
        break;
    }
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  char name[24];
  snprintf(name, sizeof(name), "ShuiQingQing-%02X%02X", mac[4], mac[5]);

  NimBLEDevice::init(name);
  NimBLEServer *server = NimBLEDevice::createServer();
  NimBLEService *service = server->createService(BLE_SERVICE);

  statusChar = service->createCharacteristic(
      BLE_STATUS, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  telemetryChar = service->createCharacteristic(
      BLE_TELEMETRY, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  NimBLECharacteristic *controlChar = service->createCharacteristic(
      BLE_CONTROL,
      NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
  controlChar->setCallbacks(new ControlCallbacks());

  service->start();
  NimBLEAdvertising *adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(BLE_SERVICE);
  adv->setName(name);
  adv->start();

  Serial.printf("ShuiQingQing ready: %s\n", name);
  notifyStatus();
}

void loop() {
  bool btn = digitalRead(BTN_PIN) == LOW;
  if (btn && !lastBtn) notifyTelemetry();
  lastBtn = btn;
  delay(30);
}
