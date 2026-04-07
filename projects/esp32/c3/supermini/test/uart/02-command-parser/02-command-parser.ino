/*
 * 5-02 시리얼 명령어 파서
 * ================================================================
 *
 * [핵심 개념 설명]
 *   명령어 파서(Command Parser)는 시리얼로 받은 텍스트를
 *   분석해서 그에 맞는 동작을 실행하는 프로그램 구조입니다.
 *
 *   동작 원리:
 *   1. Serial.read()로 한 글자씩 읽어 버퍼(배열)에 쌓습니다.
 *   2. 줄바꿈 문자('\n')가 오면 명령어 한 줄이 완성된 것으로 봅니다.
 *   3. strcmp()로 버퍼 내용을 알려진 명령어와 비교합니다.
 *   4. 일치하는 명령어가 있으면 해당 동작을 실행합니다.
 *
 *   버퍼(Buffer)란?
 *   데이터를 임시로 저장하는 메모리 공간입니다.
 *   char cmdBuffer[BUFFER_SIZE] 처럼 고정 크기 배열을 사용합니다.
 *
 *   strcmp(a, b)란?
 *   두 문자열을 비교해서 같으면 0을 반환하는 C 표준 함수입니다.
 *
 *   지원 명령어:
 *   - LED ON   : 내장 LED 켜기 (G8, Active LOW)
 *   - LED OFF  : 내장 LED 끄기
 *   - STATUS   : 현재 상태 및 업타임 출력
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개 (내장 LED G8 사용)
 *   - USB 케이블
 *
 * [연결 방법]
 *   USB로 PC에 연결합니다.
 *   Arduino IDE 시리얼 모니터를 열고:
 *     - 통신 속도: 115200 baud
 *     - 줄바꿈 설정: "Newline" (또는 "Both NL & CR")
 *   명령어를 입력하고 Enter를 누르세요.
 */

#include "config.h"

// 현재 LED 상태 (false = 꺼짐, true = 켜짐)
bool ledState = false;

// 명령어를 한 글자씩 쌓는 버퍼
// BUFFER_SIZE는 config.h에 정의 (64바이트)
char cmdBuffer[BUFFER_SIZE];
int  cmdIndex = 0;  // 현재 버퍼에 쌓인 글자 수

// 완성된 명령어를 처리하는 함수
void processCommand(const char* cmd) {
  Serial.print("[명령] '");
  Serial.print(cmd);
  Serial.print("' 수신 → ");

  // ---- LED ON ----
  if (strcmp(cmd, "LED ON") == 0) {
    ledState = true;
    digitalWrite(LED_PIN, LOW);   // Active LOW: LOW 신호 = LED 켜짐
    Serial.println("LED 켰습니다.");

  // ---- LED OFF ----
  } else if (strcmp(cmd, "LED OFF") == 0) {
    ledState = false;
    digitalWrite(LED_PIN, HIGH);  // Active LOW: HIGH 신호 = LED 꺼짐
    Serial.println("LED 껐습니다.");

  // ---- STATUS ----
  } else if (strcmp(cmd, "STATUS") == 0) {
    Serial.println();
    Serial.println("--- 현재 상태 ---");
    Serial.print("  LED    : ");
    Serial.println(ledState ? "켜짐" : "꺼짐");
    Serial.print("  업타임 : ");
    Serial.print(millis() / 1000);
    Serial.println("초");
    Serial.println("-----------------");

  // ---- 알 수 없는 명령어 ----
  } else {
    Serial.println("알 수 없는 명령어입니다.");
    Serial.println("  사용 가능: LED ON / LED OFF / STATUS");
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);  // USB CDC 안정화 대기

  // 내장 LED 핀을 출력으로 설정
  // Active LOW이므로 HIGH로 초기화 → LED 꺼짐 상태
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);

  Serial.println("================================");
  Serial.println("  시리얼 명령어 파서");
  Serial.println("================================");
  Serial.println("사용 가능한 명령어:");
  Serial.println("  LED ON  - LED 켜기");
  Serial.println("  LED OFF - LED 끄기");
  Serial.println("  STATUS  - 현재 상태 출력");
  Serial.println("(Enter 키로 명령어를 전송하세요)");
  Serial.println();
}

void loop() {
  // 시리얼 버퍼에 데이터가 있으면 한 글자씩 읽습니다
  while (Serial.available() > 0) {
    char c = Serial.read();

    // 줄바꿈('\n') 또는 캐리지리턴('\r')이 오면 명령어 완성
    if (c == '\n' || c == '\r') {
      if (cmdIndex > 0) {
        cmdBuffer[cmdIndex] = '\0';  // C 문자열 끝을 나타내는 null 문자 추가
        processCommand(cmdBuffer);
        cmdIndex = 0;                // 다음 명령어를 받기 위해 인덱스 초기화
      }
    } else {
      // 버퍼 오버플로우 방지: 최대 크기(BUFFER_SIZE-1)까지만 저장
      if (cmdIndex < BUFFER_SIZE - 1) {
        cmdBuffer[cmdIndex++] = c;
      }
    }
  }
}
