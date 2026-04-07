/*
 * Power 07 — 배터리 구동 센서 노드 (딥슬립 + Wi-Fi + MQTT)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   배터리 센서 노드의 동작 사이클
 *     ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
 *     │딥슬립    │ →  │웨이크업  │ →  │Wi-Fi연결 │ →  │데이터전송│
 *     │(60초 대기)│    │(부팅)    │    │(최대15초)│    │(MQTT)    │
 *     └──────────┘    └──────────┘    └──────────┘    └──────────┘
 *           ↑                                                 │
 *           └─────────────── 다시 딥슬립 진입 ←──────────────┘
 *
 *   배터리 수명 계산 예시 (AA 배터리 2개 = 약 3000mAh)
 *     활성 시간: 약 5초 (Wi-Fi 연결 + MQTT 전송)
 *     활성 전류: 약 100mA 평균
 *     슬립 전류: 약 0.01mA
 *     사이클당 소비: (5/3600 × 100) + (55/3600 × 0.01) ≒ 0.139 mAh
 *     배터리 수명: 3000 / 0.139 ≒ 21,580 사이클 ≒ 약 15일
 *
 *     빠른 Wi-Fi 연결이 배터리 수명에 매우 중요!
 *
 *   활성 시간 측정
 *     millis()로 웨이크업 시각부터 딥슬립 직전까지 측정.
 *     짧을수록 배터리 효율 UP.
 *
 * [라이브러리]
 *   WiFi          — arduino-esp32 기본 내장
 *   PubSubClient  — Arduino IDE 라이브러리 매니저 설치
 *                   (검색: "PubSubClient", 작성자: Nick O'Leary)
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드
 *   Wi-Fi 2.4GHz 네트워크
 *   MQTT 브로커 (Mosquitto, Home Assistant 등)
 *   (선택) G0 핀에 아날로그 센서 연결
 *
 * [연결 방법]
 *   센서 없이 테스트 시: G0 핀 플로팅 ADC 값 전송
 *   아날로그 센서 사용 시:
 *   [3.3V]──[센서]──[G0]──[GND]
 *
 * [사용 방법]
 *   secrets.h.example을 복사 → secrets.h로 저장 → 인증 정보 입력
 * ================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include "config.h"
#include "secrets.h"

// ── 활성 시작 시각 (배터리 효율 측정용) ──
uint32_t wakeupTime = 0;

// ── RTC 메모리: 누적 전송 횟수 (딥슬립 후에도 유지) ──
RTC_DATA_ATTR int sendCount = 0;

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// ─── Wi-Fi 연결 (타임아웃 포함) ──────────────────
bool connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    Serial.print("Wi-Fi 연결 중");
    uint32_t start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - start > WIFI_TIMEOUT_MS) {
            Serial.println(" 타임아웃!");
            return false;
        }
        delay(200);
        Serial.print(".");
    }
    Serial.println(" 연결!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    return true;
}

// ─── MQTT 연결 ───────────────────────────────────
bool connectMQTT() {
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

    Serial.print("MQTT 연결 중... ");
    bool connected;
    if (strlen(MQTT_USER) > 0) {
        connected = mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD);
    } else {
        connected = mqttClient.connect(MQTT_CLIENT_ID);
    }

    if (connected) {
        Serial.println("연결!");
    } else {
        Serial.print("실패. 오류 코드: ");
        Serial.println(mqttClient.state());
    }
    return connected;
}

// ─── 센서 데이터 읽기 ────────────────────────────
int readSensor() {
    // ADC 평균화 (노이즈 감소)
    int sum = 0;
    const int SAMPLES = 5;
    for (int i = 0; i < SAMPLES; i++) {
        sum += analogRead(SENSOR_PIN);
        delay(5);
    }
    return sum / SAMPLES;
}

// ─── MQTT 데이터 전송 ────────────────────────────
bool publishData(int adcValue) {
    // JSON 형식으로 데이터 구성
    char payload[128];
    snprintf(payload, sizeof(payload),
        "{\"count\":%d,\"adc\":%d,\"millis\":%lu}",
        sendCount, adcValue, millis()
    );

    Serial.print("MQTT 전송: ");
    Serial.println(payload);

    bool ok = mqttClient.publish(MQTT_TOPIC, payload);
    if (ok) {
        Serial.println("전송 성공!");
        mqttClient.loop();   // 전송 처리
        delay(100);          // 전송 완료 대기
    } else {
        Serial.println("전송 실패.");
    }
    return ok;
}

// ─── 딥슬립 진입 ─────────────────────────────────
void enterDeepSleep() {
    // ── Wi-Fi 끄기 ──
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);

    // ── 활성 시간 출력 ──
    uint32_t activeTime = millis() - wakeupTime;
    Serial.print("총 활성 시간: ");
    Serial.print(activeTime);
    Serial.println("ms (짧을수록 배터리 절약)");

    // ── 딥슬립 설정 및 진입 ──
    esp_sleep_enable_timer_wakeup((uint64_t)SLEEP_DURATION_SEC * 1000000ULL);
    Serial.print(SLEEP_DURATION_SEC);
    Serial.println("초 후 깨어납니다. 딥슬립 진입...\n");
    Serial.flush();
    esp_deep_sleep_start();
}

void setup() {
    wakeupTime = millis();   // 활성 시작 시각 기록

    Serial.begin(BAUD_RATE);
    delay(200);

    sendCount++;
    Serial.println("\n=== 배터리 센서 노드 ===");
    Serial.print("전송 횟수: ");
    Serial.println(sendCount);

    // ── 1단계: 센서 읽기 (Wi-Fi 전에 먼저 — 더 빠름) ──
    Serial.print("센서 읽기... ADC = ");
    int adcValue = readSensor();
    Serial.println(adcValue);

    // ── 2단계: Wi-Fi 연결 ──
    if (!connectWiFi()) {
        Serial.println("Wi-Fi 실패 — 딥슬립으로 전환");
        enterDeepSleep();
        return;
    }

    // ── 3단계: MQTT 연결 ──
    if (!connectMQTT()) {
        Serial.println("MQTT 실패 — 딥슬립으로 전환");
        enterDeepSleep();
        return;
    }

    // ── 4단계: 데이터 전송 ──
    publishData(adcValue);

    // ── 5단계: 딥슬립 진입 ──
    enterDeepSleep();
}

void loop() {
    // 딥슬립 패턴에서는 실행되지 않음
    // setup()에서 enterDeepSleep()을 호출하므로 여기까지 오지 않음
}
