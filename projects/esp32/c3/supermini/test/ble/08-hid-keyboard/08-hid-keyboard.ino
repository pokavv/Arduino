/*
 * BLE 08 — BLE HID 키보드 (버튼 누르면 "Hello World" 입력)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   HID (Human Interface Device)
 *     키보드, 마우스, 게임패드처럼 사람이 컴퓨터를 조작하는 장치.
 *     USB HID는 USB 키보드 꽂는 것, BLE HID는 무선 키보드와 같은 원리.
 *     ESP32를 BLE HID로 설정하면 스마트폰/PC에 무선 키보드로 인식된다.
 *
 *   BLE HID 키보드
 *     드라이버 설치 없이 OS가 자동으로 인식한다 (표준 HID 프로토콜).
 *     Windows, macOS, Android, iOS 모두 지원.
 *
 *   BOOT 버튼 (G9)
 *     보드에 달려 있는 기본 버튼. 평소에는 HIGH, 누르면 LOW.
 *     부팅 시 G9을 LOW로 누르면 다운로드 모드 진입 — 보통 때는 일반 버튼으로 사용 가능.
 *
 *   채터링 (Debounce)
 *     버튼을 한 번 누를 때 전기적으로 여러 번 눌리는 것처럼 신호가 튀는 현상.
 *     millis() 기반 시간 확인으로 짧은 시간 내 중복 입력을 무시한다.
 *
 * [준비물]
 *   없음 — 보드 내장 BOOT 버튼(G9) 사용
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   1. 업로드 후 스마트폰/PC의 블루투스 설정 열기
 *   2. "ESP32-Keyboard" 장치 페어링
 *   3. 메모장/문자 앱 열기
 *   4. BOOT 버튼(G9) 누르면 "Hello World" + Enter 입력됨
 *
 * [라이브러리]
 *   ESP32 BLE Keyboard (T-vK/ESP32-BLE-Keyboard)
 *   GitHub: https://github.com/T-vK/ESP32-BLE-Keyboard
 *   → ZIP 다운로드 → Arduino IDE → 스케치 → 라이브러리 포함 → ZIP 라이브러리 추가
 *   또는 Arduino IDE 라이브러리 매니저에서 "ESP32 BLE Keyboard" 검색
 */

#include <BleKeyboard.h>
#include "config.h"

// ─── BLE 키보드 객체 생성 ───────────────────────
// 인자: 장치이름, 제조사명, 초기배터리%
BleKeyboard bleKeyboard(DEVICE_NAME, "ESP32-C3", 100);

// ─── 전역 변수 ──────────────────────────────────
bool     lastButtonState  = HIGH;   // 이전 버튼 상태 (HIGH = 안 눌림)
uint32_t lastDebounceTime = 0;      // 마지막 상태 변경 시각

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE HID 키보드 시작");

  // 내장 LED 초기화
  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // 꺼둠

  // BOOT 버튼 초기화 (INPUT_PULLUP: 풀업 저항 내장 — 기본 HIGH)
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // BLE 키보드 시작
  bleKeyboard.begin();

  Serial.println("블루투스 설정에서 \"ESP32-Keyboard\" 페어링 후 버튼 누르세요");
}

void loop() {
  // BLE 연결 상태 LED 표시
  if (bleKeyboard.isConnected()) {
    digitalWrite(BUILTIN_LED_PIN, LOW);    // 연결됨 — LED 켜기
  } else {
    // 연결 전 LED 느리게 깜빡임 (페어링 대기 중 표시)
    digitalWrite(BUILTIN_LED_PIN, (millis() / 1000) % 2 == 0 ? LOW : HIGH);
    return;  // 연결 전에는 버튼 처리 불필요
  }

  // ── 버튼 읽기 (millis 기반 채터링 방지) ──
  bool currentState = digitalRead(BUTTON_PIN);

  if (currentState != lastButtonState) {
    lastDebounceTime = millis();   // 상태 변화 감지 시각 기록
  }

  // DEBOUNCE_MS 이상 안정된 신호일 때만 처리
  if ((millis() - lastDebounceTime) > DEBOUNCE_MS) {
    // 버튼이 새로 눌린 순간 (HIGH → LOW 전환)
    if (currentState == LOW && lastButtonState == HIGH) {
      Serial.println("버튼 눌림 → \"Hello World\" 입력");

      // 키보드처럼 문자열 입력
      bleKeyboard.println("Hello World");
      // println = 문자열 입력 + Enter 키
      // print   = 문자열만 입력 (Enter 없음)
    }
  }

  lastButtonState = currentState;
  delay(10);
}
