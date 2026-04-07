/*
 * combo/10-captive-portal-wifi-config — WiFiManager Captive Portal
 * ================================================================
 *
 * [핵심 개념 설명]
 *   Captive Portal (캡티브 포털)
 *     - 공용 Wi-Fi(공항, 카페)에 접속하면 자동으로 뜨는 설정/로그인 화면
 *     - 동작 원리:
 *         1) ESP32가 AP(액세스 포인트) 모드로 Wi-Fi 네트워크 생성
 *         2) 스마트폰에서 해당 Wi-Fi 연결 시 자동으로 웹 페이지 팝업
 *         3) 웹 페이지에서 실제 Wi-Fi SSID/비밀번호 입력
 *         4) ESP32가 입력된 정보로 실제 Wi-Fi에 연결 (STA 모드)
 *         5) 설정 정보를 플래시에 저장 → 재시작 후 자동 연결
 *
 *   장점: secrets.h에 Wi-Fi 정보를 하드코딩하지 않아도 됨
 *         여러 위치에서 사용하는 제품에 적합
 *
 *   WiFiManager 라이브러리 (tzapu)
 *     - autoConnect(): 저장된 Wi-Fi로 자동 연결 시도
 *                     실패 시 AP + Captive Portal 자동 시작
 *     - 설정 완료 후 STA 모드로 전환
 *
 * [라이브러리]
 *   WiFiManager (tzapu) — 라이브러리 매니저에서 설치
 *   "WiFiManager" 검색 → "WiFiManager by tzapu" 설치
 *
 * [준비물]
 *   없음 — 스마트폰 필요 (Wi-Fi 설정 입력용)
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 *   스마트폰 Wi-Fi에서 "ESP32-Setup" 찾아 연결 → 설정 화면 입력
 */

#include "config.h"
#include <WiFiManager.h>   // tzapu WiFiManager

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" WiFiManager Captive Portal");
  Serial.println("===================================");

  // ---- LED 설정 (상태 표시용) ----
  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);  // 초기: 꺼짐 (Active LOW)

  // ---- LED 깜빡임: Wi-Fi 연결 시도 중 표시 ----
  blinkLed(3, 100);  // 3회 빠른 깜빡임

  // ---- WiFiManager 초기화 ----
  WiFiManager wm;

  // ---- 디버그 출력 (선택적) ----
  // wm.setDebugOutput(true);  // 상세 로그 필요 시 주석 해제

  // ---- Captive Portal 타임아웃 설정 ----
  // 이 시간 동안 아무도 설정 안 하면 재시작
  wm.setConfigPortalTimeout(CONFIG_PORTAL_TIMEOUT);

  // ---- 저장된 Wi-Fi로 자동 연결 시도 ----
  // 실패 시 AP_SSID 이름으로 AP + Captive Portal 자동 시작
  Serial.print("저장된 Wi-Fi 연결 시도...");
  bool connected = wm.autoConnect(AP_SSID);  // AP 이름 (비밀번호 없음)

  if (!connected) {
    Serial.println();
    Serial.println("[경고] Wi-Fi 연결 실패 또는 타임아웃");
    Serial.println("→ 재시작 후 다시 시도...");
    delay(3000);
    ESP.restart();  // 재시작
    return;
  }

  // ---- 연결 성공 ----
  Serial.println();
  Serial.println("Wi-Fi 연결 성공!");
  Serial.print("SSID: "); Serial.println(WiFi.SSID());
  Serial.print("IP  : "); Serial.println(WiFi.localIP());
  Serial.print("RSSI: "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");

  // 연결 성공 표시: LED 5회 깜빡임
  blinkLed(5, 200);
  digitalWrite(BUILTIN_LED_PIN, LOW);  // 연결 완료: LED 켜둠 (Active LOW)

  Serial.println();
  Serial.println("===================================");
  Serial.println("이제 Wi-Fi 연결 상태로 동작합니다.");
  Serial.println("Wi-Fi 재설정: 전원 켤 때 BOOT 버튼 3초 누르기");
  Serial.println("(또는 wm.resetSettings() 호출)");
  Serial.println("===================================");
}

void loop() {
  // Wi-Fi 연결 유지 확인
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[경고] Wi-Fi 연결 끊어짐 — 재시작");
    delay(3000);
    ESP.restart();
  }

  delay(5000);
  Serial.print("동작 중 | IP: ");
  Serial.print(WiFi.localIP());
  Serial.print(" | RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

// ---- LED 깜빡임 헬퍼 함수 ----
void blinkLed(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUILTIN_LED_PIN, LOW);   // 켜짐 (Active LOW)
    delay(delayMs);
    digitalWrite(BUILTIN_LED_PIN, HIGH);  // 꺼짐
    delay(delayMs);
  }
}
