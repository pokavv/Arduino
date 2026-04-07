/*
 * 5-04 두 장치 간 UART 통신
 * ================================================================
 *
 * [핵심 개념 설명]
 *   UART 통신에서 두 장치를 연결할 때는 TX와 RX를 교차 연결해야 합니다.
 *   한쪽이 보내면(TX) 상대방이 받아야(RX) 하기 때문입니다.
 *
 *   연결 방법:
 *     보드A G5(TX)  →  보드B G4(RX)
 *     보드A G4(RX)  ←  보드B G5(TX)
 *     보드A GND     ---  보드B GND  (반드시 공통 GND!)
 *
 *   이 스케치는 config.h의 ROLE_SENDER 정의 여부에 따라
 *   송신기 또는 수신기로 동작합니다.
 *   같은 코드를 두 보드에 업로드하되, config.h의 역할만 바꿔서 올립니다.
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 2개
 *   - USB 케이블 2개
 *   - 점퍼 와이어 3개 (TX-RX, RX-TX, GND-GND)
 *
 * [연결 방법]
 *   보드A G5(TX) → 보드B G4(RX)
 *   보드A G4(RX) ← 보드B G5(TX)
 *   보드A GND    --- 보드B GND
 */

#include "config.h"

// 마지막 송신 시각 (송신기 역할일 때 사용)
unsigned long lastSendMs = 0;

// 송신 카운터
unsigned long sendCount = 0;

void setup() {
  // UART0: PC 시리얼 모니터 (동작 확인용)
  Serial.begin(MONITOR_BAUD);
  delay(500);

  // UART1: 다른 보드와 통신 (핀 직접 지정)
  Serial1.begin(BAUD_RATE, SERIAL_8N1, RX_PIN, TX_PIN);

#ifdef ROLE_SENDER
  Serial.println("=== 역할: 송신기(SENDER) ===");
  Serial.print("TX핀: G");
  Serial.print(TX_PIN);
  Serial.print(", RX핀: G");
  Serial.print(RX_PIN);
  Serial.print(", 속도: ");
  Serial.println(BAUD_RATE);
  Serial.println("1초마다 카운터를 상대방에게 보냅니다.");
#else
  Serial.println("=== 역할: 수신기(RECEIVER) ===");
  Serial.print("TX핀: G");
  Serial.print(TX_PIN);
  Serial.print(", RX핀: G");
  Serial.print(RX_PIN);
  Serial.print(", 속도: ");
  Serial.println(BAUD_RATE);
  Serial.println("상대방의 메시지를 기다립니다...");
#endif
}

void loop() {
#ifdef ROLE_SENDER
  // ---- 송신기 역할 ----
  unsigned long nowMs = millis();
  if (nowMs - lastSendMs >= SEND_INTERVAL) {
    lastSendMs = nowMs;
    sendCount++;

    // 다른 보드로 카운터 전송
    Serial1.print("COUNT:");
    Serial1.println(sendCount);

    // 로컬 모니터에도 출력
    Serial.print("[송신] COUNT:");
    Serial.println(sendCount);
  }

#else
  // ---- 수신기 역할 ----
  // UART1에서 받은 데이터를 줄 단위로 읽어서 출력합니다
  while (Serial1.available() > 0) {
    String line = Serial1.readStringUntil('\n');
    line.trim();  // 앞뒤 공백/줄바꿈 제거
    if (line.length() > 0) {
      Serial.print("[수신] ");
      Serial.println(line);
    }
  }
#endif
}
