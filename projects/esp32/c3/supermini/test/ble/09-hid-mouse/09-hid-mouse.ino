/*
 * BLE 09 — BLE HID 마우스 (sin/cos로 원 그리기)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   HID 마우스 동작 방식
 *     마우스는 절대 좌표가 아닌 "상대 이동값"을 보낸다.
 *     "오른쪽으로 5픽셀, 아래로 3픽셀 이동" 형태로 전달.
 *     현재 커서 위치를 기준으로 상대적으로 움직인다.
 *
 *   원 그리기 원리 (sin / cos)
 *     원의 각도를 0°부터 360°까지 조금씩 증가시키면서
 *     x = cos(각도) * 반지름  → 가로 이동량
 *     y = sin(각도) * 반지름  → 세로 이동량
 *     각 단계마다 이전 위치와의 차이(delta)만 보내면 원을 그린다.
 *
 *   라디안 (radian)
 *     각도를 표현하는 수학 단위. 360° = 2π 라디안.
 *     C/C++ sin(), cos() 함수는 라디안을 받으므로
 *     deg * PI / 180.0 로 변환해야 한다.
 *
 *   move(x, y, wheel)
 *     x: 가로 이동 (-127 ~ 127, 양수=오른쪽)
 *     y: 세로 이동 (-127 ~ 127, 양수=아래쪽)
 *     wheel: 스크롤 (-127 ~ 127, 양수=위 스크롤)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   1. 업로드 후 PC/스마트폰 블루투스에서 "ESP32-Mouse" 페어링
 *   2. 연결 후 커서가 자동으로 원을 그리기 시작
 *   3. BOOT 버튼(G9) 누르면 원 그리기 일시정지/재개 토글
 *
 * [라이브러리]
 *   ESP32 BLE Mouse (T-vK/ESP32-BLE-Mouse)
 *   GitHub: https://github.com/T-vK/ESP32-BLE-Mouse
 *   → ZIP 다운로드 → Arduino IDE → 스케치 → 라이브러리 포함 → ZIP 라이브러리 추가
 */

#include <BleMouse.h>
#include <math.h>    // sin(), cos(), M_PI
#include "config.h"

// ─── BLE 마우스 객체 생성 ───────────────────────
BleMouse bleMouse(DEVICE_NAME, "ESP32-C3", 100);

// ─── 전역 변수 ──────────────────────────────────
bool     running          = true;    // 원 그리기 실행 여부
int      stepIndex        = 0;       // 현재 원 단계 (0 ~ CIRCLE_STEPS-1)
uint32_t lastMoveTime     = 0;
bool     lastButtonState  = HIGH;
uint32_t lastDebounceTime = 0;

// ─── 원의 각 단계 좌표 계산 ─────────────────────
// 이전 단계 대비 이동량(delta)을 계산해 반환
void getCircleDelta(int step, int8_t& dx, int8_t& dy) {
  // 현재 단계와 이전 단계의 각도 (라디안)
  float angleNow  = (step       * 2.0f * M_PI) / CIRCLE_STEPS;
  float anglePrev = ((step - 1) * 2.0f * M_PI) / CIRCLE_STEPS;

  // 각 단계의 절대 좌표 (반지름 기준)
  float xNow  = cos(angleNow)  * CIRCLE_RADIUS;
  float yNow  = sin(angleNow)  * CIRCLE_RADIUS;
  float xPrev = cos(anglePrev) * CIRCLE_RADIUS;
  float yPrev = sin(anglePrev) * CIRCLE_RADIUS;

  // 이전 단계 대비 이동량 (delta)
  // int8_t 범위(-128~127) 클램프 처리
  float dxf = xNow - xPrev;
  float dyf = yNow - yPrev;
  dx = (int8_t)constrain((int)dxf, -127, 127);
  dy = (int8_t)constrain((int)dyf, -127, 127);
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE HID 마우스 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  pinMode(BUTTON_PIN, INPUT_PULLUP);   // BOOT 버튼 (풀업)

  bleMouse.begin();
  Serial.println("블루투스 설정에서 \"ESP32-Mouse\" 페어링 후 커서 움직임 확인");
}

void loop() {
  // ── 연결 상태 LED 표시 ──
  if (!bleMouse.isConnected()) {
    digitalWrite(BUILTIN_LED_PIN, (millis() / 500) % 2 == 0 ? LOW : HIGH);
    return;
  }
  digitalWrite(BUILTIN_LED_PIN, LOW);   // 연결됨 — LED 켜기

  // ── BOOT 버튼으로 일시정지 / 재개 토글 ──
  bool btnState = digitalRead(BUTTON_PIN);
  if (btnState != lastButtonState) lastDebounceTime = millis();

  if ((millis() - lastDebounceTime) > 50) {
    if (btnState == LOW && lastButtonState == HIGH) {
      running = !running;
      Serial.println(running ? "원 그리기 재개" : "원 그리기 일시정지");
    }
  }
  lastButtonState = btnState;

  // ── 원 그리기 (millis 기반 논블로킹) ──
  if (running && (millis() - lastMoveTime >= MOVE_INTERVAL_MS)) {
    lastMoveTime = millis();

    int8_t dx, dy;
    getCircleDelta(stepIndex, dx, dy);
    bleMouse.move(dx, dy, 0);   // x 이동, y 이동, 스크롤

    stepIndex = (stepIndex + 1) % CIRCLE_STEPS;   // 다음 단계로 (원형 반복)
  }
}
