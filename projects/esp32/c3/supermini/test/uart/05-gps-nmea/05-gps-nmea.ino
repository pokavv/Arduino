/*
 * 5-05 GPS 모듈 NMEA 파싱
 * ================================================================
 *
 * [핵심 개념 설명]
 *   GPS 모듈은 NMEA 0183 이라는 표준 형식으로 위치 데이터를 보냅니다.
 *   각 줄은 '$'로 시작하고 쉼표로 구분된 데이터를 담고 있습니다.
 *
 *   이 스케치에서 파싱하는 문장:
 *   - $GPGLL: 위도, 경도, 시각
 *     형식: $GPGLL,위도,N/S,경도,E/W,시각,상태,*체크섬
 *
 *   - $GPRMC: 권장 최소 GPS 데이터 (위도, 경도, 속도, 방향 포함)
 *     형식: $GPRMC,시각,상태,위도,N/S,경도,E/W,...
 *
 *   위도/경도 단위 변환:
 *   GPS는 DDDMM.MMMM 형식으로 전송합니다.
 *   예: 3723.4000 → 37도 23.4분 → 37 + 23.4/60 = 37.39도
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - Neo-6M GPS 모듈 1개
 *   - USB 케이블
 *   - 점퍼 와이어
 *
 * [연결 방법]
 *   Neo-6M GPS    →   ESP32-C3
 *   VCC           →   3.3V
 *   GND           →   GND
 *   TX            →   G4 (RX)
 *   RX            →   G5 (TX) — 보통 연결 불필요
 *
 *   ★ GPS는 실외에서 픽스(위성 신호 수신)가 잡혀야 위치 데이터가 나옵니다.
 *   처음 켜고 수분~수십분이 걸릴 수 있습니다.
 */

#include "config.h"

// NMEA 문장을 한 줄씩 쌓는 버퍼
char nmeaBuffer[128];
int  nmeaIndex = 0;

// 마지막으로 파싱한 위도/경도
float latitude  = 0.0;
float longitude = 0.0;
bool  hasFix    = false;  // GPS 픽스(위성 수신) 여부

// DDDMM.MMMM 형식을 십진수 도(degree)로 변환하는 함수
float nmeaToDecimalDegrees(const char* raw) {
  // raw 예: "3723.4567"
  float rawVal = atof(raw);
  int degrees  = (int)(rawVal / 100);  // 앞 두 자리(또는 세 자리)가 도
  float minutes = rawVal - degrees * 100.0f;  // 나머지가 분
  return degrees + minutes / 60.0f;
}

// 쉼표로 구분된 NMEA 문장에서 n번째 필드를 추출하는 함수
// dest: 결과를 저장할 버퍼, src: NMEA 문장 전체, fieldIndex: 0부터 시작
void getNmeaField(char* dest, const char* src, int fieldIndex) {
  int commaCount = 0;
  int destIdx    = 0;

  for (int i = 0; src[i] != '\0'; i++) {
    if (src[i] == ',') {
      commaCount++;
      if (commaCount > fieldIndex) break;  // 필드 끝
      continue;
    }
    if (src[i] == '*') break;  // 체크섬 시작 — 데이터 끝
    if (commaCount == fieldIndex) {
      dest[destIdx++] = src[i];
    }
  }
  dest[destIdx] = '\0';
}

// $GPGLL 문장 파싱
// 형식: $GPGLL,위도,N/S,경도,E/W,시각,상태,*체크섬
void parseGPGLL(const char* sentence) {
  char field[20];

  // 필드 1: 위도 (DDMM.MMMM)
  getNmeaField(field, sentence, 1);
  if (field[0] == '\0') return;  // 데이터 없음 = 픽스 없음
  float lat = nmeaToDecimalDegrees(field);

  // 필드 2: N 또는 S
  getNmeaField(field, sentence, 2);
  if (strcmp(field, "S") == 0) lat = -lat;  // 남위는 음수

  // 필드 3: 경도 (DDDMM.MMMM)
  getNmeaField(field, sentence, 3);
  if (field[0] == '\0') return;
  float lon = nmeaToDecimalDegrees(field);

  // 필드 4: E 또는 W
  getNmeaField(field, sentence, 4);
  if (strcmp(field, "W") == 0) lon = -lon;  // 서경은 음수

  // 필드 6: 상태 (A = 유효, V = 무효)
  getNmeaField(field, sentence, 6);
  if (strcmp(field, "A") != 0) {
    Serial.println("[GPS] $GPGLL: 픽스 없음 (위성 신호 수신 중...)");
    hasFix = false;
    return;
  }

  latitude  = lat;
  longitude = lon;
  hasFix    = true;

  Serial.print("[GPS] $GPGLL 위도: ");
  Serial.print(latitude, 6);
  Serial.print("°  경도: ");
  Serial.print(longitude, 6);
  Serial.println("°");
}

// $GPRMC 문장 파싱
// 형식: $GPRMC,시각,상태,위도,N/S,경도,E/W,속도,방향,...
void parseGPRMC(const char* sentence) {
  char field[20];

  // 필드 2: 상태 (A = 유효, V = 무효)
  getNmeaField(field, sentence, 2);
  if (strcmp(field, "A") != 0) {
    // GPRMC는 매우 자주 전송되므로 픽스 없을 때는 출력 생략
    hasFix = false;
    return;
  }

  // 필드 3: 위도
  getNmeaField(field, sentence, 3);
  if (field[0] == '\0') return;
  float lat = nmeaToDecimalDegrees(field);

  // 필드 4: N/S
  getNmeaField(field, sentence, 4);
  if (strcmp(field, "S") == 0) lat = -lat;

  // 필드 5: 경도
  getNmeaField(field, sentence, 5);
  if (field[0] == '\0') return;
  float lon = nmeaToDecimalDegrees(field);

  // 필드 6: E/W
  getNmeaField(field, sentence, 6);
  if (strcmp(field, "W") == 0) lon = -lon;

  latitude  = lat;
  longitude = lon;
  hasFix    = true;

  Serial.print("[GPS] $GPRMC 위도: ");
  Serial.print(latitude, 6);
  Serial.print("°  경도: ");
  Serial.print(longitude, 6);
  Serial.println("°");
}

// 한 줄의 NMEA 문장을 처리하는 함수
void processNmeaSentence(const char* sentence) {
  // 문장 식별자 비교 (앞 6글자)
  if (strncmp(sentence, "$GPGLL", 6) == 0) {
    parseGPGLL(sentence);
  } else if (strncmp(sentence, "$GPRMC", 6) == 0) {
    parseGPRMC(sentence);
  }
  // 다른 문장($GPGGA, $GPGSV 등)은 무시합니다
}

void setup() {
  // UART0: PC 시리얼 모니터
  Serial.begin(SERIAL_BAUD);
  delay(500);

  // UART1: GPS 모듈 (Neo-6M 기본 9600 baud)
  Serial1.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  Serial.println("=== GPS NMEA 파싱 시작 ===");
  Serial.print("GPS RX핀: G");
  Serial.print(GPS_RX_PIN);
  Serial.print(" (GPS TX 연결), 속도: ");
  Serial.print(GPS_BAUD);
  Serial.println(" baud");
  Serial.println("실외에서 GPS 픽스가 잡히면 위도/경도가 출력됩니다.");
  Serial.println("처음에는 수 분이 걸릴 수 있습니다.\n");
}

void loop() {
  // GPS 모듈에서 데이터를 한 글자씩 읽어 NMEA 버퍼에 쌓습니다
  while (Serial1.available() > 0) {
    char c = Serial1.read();

    if (c == '\n') {
      // 줄바꿈 — 한 문장 완성
      nmeaBuffer[nmeaIndex] = '\0';
      if (nmeaIndex > 0) {
        processNmeaSentence(nmeaBuffer);
      }
      nmeaIndex = 0;  // 버퍼 초기화

    } else if (c == '\r') {
      // 캐리지리턴 무시

    } else if (c == '$') {
      // 새 문장 시작 — 버퍼를 초기화하고 '$'부터 저장
      nmeaIndex = 0;
      nmeaBuffer[nmeaIndex++] = c;

    } else {
      // 일반 문자 — 버퍼에 추가 (오버플로우 방지)
      if (nmeaIndex < (int)sizeof(nmeaBuffer) - 1) {
        nmeaBuffer[nmeaIndex++] = c;
      }
    }
  }
}
