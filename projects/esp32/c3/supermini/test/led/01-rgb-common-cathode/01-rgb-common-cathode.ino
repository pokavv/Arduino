/**
 * @file  01-rgb-common-cathode.ino
 * @brief RGB LED(공통 캐소드) 색상 순환 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * RGB LED는 빨강(R), 초록(G), 파랑(B) 세 개의 LED가 하나의 패키지에
 * 들어있는 부품입니다.
 *
 * 공통 캐소드(Common Cathode) 방식:
 * - 세 LED의 (-)극(캐소드)이 하나로 묶여 GND에 연결됩니다.
 * - 각 색상 핀에 HIGH 신호를 보내면 해당 LED가 켜집니다.
 * - PWM으로 0~255 값을 조절해 밝기(색상 혼합)를 제어합니다.
 *
 * PWM(Pulse Width Modulation, 펄스 폭 변조):
 * - 빠르게 켜고 끄는 신호로 밝기를 조절합니다.
 * - 0 = 완전 꺼짐, 255 = 완전 켜짐
 * - ESP32는 analogWrite() 대신 ledcWrite()를 사용합니다.
 *
 * LEDC(LED Control) 채널:
 * - ESP32의 PWM 제어 전용 하드웨어
 * - 채널 번호(0~7)를 핀에 연결해서 사용합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - 없음 (Arduino ESP32 내장 함수만 사용)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - RGB LED (공통 캐소드) x1
 * - 220Ω 저항 x3 (각 색상 핀에 하나씩)
 * - 점프 와이어, 브레드보드
 * ---------------------------------------------------------------
 * [연결 방법]
 * RGB LED (공통 캐소드):
 *   R핀  → 220Ω 저항 → ESP32 G2
 *   G핀  → 220Ω 저항 → ESP32 G3
 *   B핀  → 220Ω 저항 → ESP32 G4
 *   공통(-) → GND
 *
 * ※ 저항 없이 직접 연결하면 LED가 타버릴 수 있습니다!
 * ---------------------------------------------------------------
 */

#include "config.h"

// ---------------------------------------------------------------
// 색상 정의 구조체
// R, G, B 각각 0~255 값을 묶어서 관리합니다.
// ---------------------------------------------------------------
struct RgbColor {
    uint8_t r;
    uint8_t g;
    uint8_t b;
};

// ---------------------------------------------------------------
// 색상 순환 목록
// 빨강 → 초록 → 파랑 → 흰색 → 보라 → 청록 → 노랑
// ---------------------------------------------------------------
const RgbColor COLOR_LIST[] = {
    {255,   0,   0},   // 빨강 (Red)
    {  0, 255,   0},   // 초록 (Green)
    {  0,   0, 255},   // 파랑 (Blue)
    {255, 255, 255},   // 흰색 (White)
    {128,   0, 128},   // 보라 (Purple)
    {  0, 255, 255},   // 청록 (Cyan)
    {255, 255,   0},   // 노랑 (Yellow)
};

// 색상 목록 개수 (배열 크기를 자동 계산)
const int COLOR_COUNT = sizeof(COLOR_LIST) / sizeof(COLOR_LIST[0]);

// 현재 색상 인덱스
int currentColorIndex = 0;

// millis() 타이머 변수
unsigned long lastColorChangeMs = 0;

// ---------------------------------------------------------------
// 함수 선언 (프로토타입)
// ---------------------------------------------------------------
void setupPwm();
void setColor(uint8_t r, uint8_t g, uint8_t b);
void printCurrentColor(const RgbColor& color);

// ---------------------------------------------------------------
// setup(): 처음 한 번만 실행되는 초기화 함수
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    Serial.println("===== RGB LED (공통 캐소드) 색상 순환 =====");

    // PWM 채널 설정
    setupPwm();

    // 첫 번째 색상 출력
    setColor(COLOR_LIST[0].r, COLOR_LIST[0].g, COLOR_LIST[0].b);
    printCurrentColor(COLOR_LIST[0]);
}

// ---------------------------------------------------------------
// loop(): 반복 실행되는 메인 루프
// millis()로 논블로킹(non-blocking) 타이머를 구현합니다.
// delay()를 쓰면 그 시간 동안 다른 작업을 못 하지만,
// millis()를 쓰면 다른 작업과 병행할 수 있습니다.
// ---------------------------------------------------------------
void loop() {
    unsigned long now = millis();

    // COLOR_HOLD_MS 간격마다 다음 색상으로 전환
    if (now - lastColorChangeMs >= COLOR_HOLD_MS) {
        lastColorChangeMs = now;

        // 다음 색상 인덱스 (마지막이면 처음으로 돌아감)
        currentColorIndex = (currentColorIndex + 1) % COLOR_COUNT;

        const RgbColor& c = COLOR_LIST[currentColorIndex];
        setColor(c.r, c.g, c.b);
        printCurrentColor(c);
    }
}

// ---------------------------------------------------------------
// setupPwm(): LEDC 채널과 핀을 초기화합니다.
// ---------------------------------------------------------------
void setupPwm() {
    // 채널 설정: ledcSetup(채널번호, 주파수, 해상도비트)
    ledcSetup(CHANNEL_R, PWM_FREQ, PWM_RES);
    ledcSetup(CHANNEL_G, PWM_FREQ, PWM_RES);
    ledcSetup(CHANNEL_B, PWM_FREQ, PWM_RES);

    // 핀 연결: ledcAttachPin(GPIO핀, 채널번호)
    ledcAttachPin(R_PIN, CHANNEL_R);
    ledcAttachPin(G_PIN, CHANNEL_G);
    ledcAttachPin(B_PIN, CHANNEL_B);

    Serial.println("[PWM] LEDC 채널 초기화 완료");
}

// ---------------------------------------------------------------
// setColor(): RGB 값으로 LED 색상을 설정합니다.
// 각 채널에 ledcWrite(채널번호, 듀티값)으로 PWM 신호를 보냅니다.
// ---------------------------------------------------------------
void setColor(uint8_t r, uint8_t g, uint8_t b) {
    ledcWrite(CHANNEL_R, r);
    ledcWrite(CHANNEL_G, g);
    ledcWrite(CHANNEL_B, b);
}

// ---------------------------------------------------------------
// printCurrentColor(): 시리얼에 현재 색상 정보를 출력합니다.
// ---------------------------------------------------------------
void printCurrentColor(const RgbColor& color) {
    Serial.printf("[색상 변경] R=%3d  G=%3d  B=%3d\n",
                  color.r, color.g, color.b);
}
