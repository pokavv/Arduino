/*
 * 5-05 GPS 모듈 NMEA 파싱
 * ================================================================
 *
 * [핵심 개념 설명]
 *   GPS(Global Positioning System) 모듈은 위성 신호를 받아
 *   NMEA 0183이라는 표준 텍스트 형식으로 위치 데이터를 전송합니다.
 *
 *   NMEA 문장 구조:
 *   $GPRMC,시각,상태,위도,N/S,경도,E/W,속도(노트),방향,날짜,...*체크섬
 *   예: $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
 *
 *   $GPRMC란?
 *   RMC = Recommended Minimum navigation information
 *   가장 핵심적인 GPS 데이터 문장으로, 위도/경도/속도/방향을 담습니다.
 *   - 시각: HHMMSS.ss (UTC 기준)
 *   - 상태: A = 유효 데이터, V = 무효 (위성 수신 중)
 *   - 위도/경도: DDDMM.MMMM 형식 (도/분 혼합)
 *     예: 4807.038 = 48도 07.038분 = 48 + 7.038/60 = 48.1173도
 *   - N/S: 북위(N) 또는 남위(S)
 *   - E/W: 동경(E) 또는 서경(W)
 *   - 속도: 노트(knot) 단위 (1노트 = 1.852 km/h)
 *
 *   GPS가 없을 때 테스트하는 방법:
 *   시리얼 모니터에서 직접 NMEA 문장을 입력하면 파싱 결과를 확인할 수 있습니다.
 *   예시 입력: $GPRMC,123519,A,3731.500,N,12659.000,E,000.0,000.0,070426,,,A*68
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - USB 케이블
 *   - GPS 모듈 (Neo-6M, Neo-8M 등) — 없으면 시리얼 직접 입력으로 테스트 가능
 *   - 점퍼 와이어
 *
 * [연결 방법]
 *   GPS 모듈     ESP32-C3 Super Mini
 *   VCC    ──→  3.3V  (★ 5V 연결 금지! ESP32-C3는 3.3V 동작)
 *   GND    ──→  GND
 *   TX     ──→  G20 (RX1)   ← GPS가 보내는 NMEA 데이터를 수신
 *   RX     ──→  G21 (TX1)   ← GPS에 명령 전송 (보통 연결 불필요)
 *
 *   GPS 수신 팁:
 *   - 실외 또는 창가에서 사용하세요 (건물 내부는 신호가 약함)
 *   - 처음 켤 때(Cold Start)는 수 분이 걸릴 수 있습니다
 *   - 파란 LED가 깜빡이면 위성 신호 수신 중, 고정 점등이면 픽스 완료
 */

#include "config.h"

// NMEA 문장을 한 글자씩 쌓는 버퍼
char nmeaBuffer[NMEA_BUFFER_SIZE];
int  nmeaIndex = 0;

// 마지막으로 파싱한 데이터
float  lastLatitude  = 0.0;
float  lastLongitude = 0.0;
float  lastSpeedKmh  = 0.0;
bool   hasFix        = false;  // GPS 픽스(위성 수신 성공) 여부

// ----------------------------------------------------------------
// DDDMM.MMMM 형식을 십진수 도(Decimal Degrees)로 변환
// 예: "3731.5000" → 37 + 31.5/60 = 37.5250도
// ----------------------------------------------------------------
float nmeaCoordToDecimal(const char* raw) {
  if (raw[0] == '\0') return 0.0;
  float rawVal  = atof(raw);
  int   degrees = (int)(rawVal / 100);         // 앞부분이 도(degrees)
  float minutes = rawVal - (degrees * 100.0f); // 뒷부분이 분(minutes)
  return degrees + (minutes / 60.0f);
}

// ----------------------------------------------------------------
// NMEA 문장에서 쉼표로 구분된 n번째 필드 추출
// fieldIndex: 0부터 시작 (0번 = 문장 식별자, 예: "$GPRMC")
// ----------------------------------------------------------------
void getNmeaField(char* dest, const char* src, int fieldIndex) {
  int commaCount = 0;
  int destIdx    = 0;

  for (int i = 0; src[i] != '\0'; i++) {
    if (src[i] == ',' || src[i] == '*') {
      // 쉼표 또는 체크섬 구분자(*) 만남
      if (commaCount == fieldIndex) break;  // 원하는 필드 끝
      commaCount++;
      continue;
    }
    if (commaCount == fieldIndex) {
      dest[destIdx++] = src[i];
    }
  }
  dest[destIdx] = '\0';
}

// ----------------------------------------------------------------
// $GPRMC 문장 파싱
// 형식: $GPRMC,시각,상태,위도,N/S,경도,E/W,속도(노트),방향,...
// ----------------------------------------------------------------
void parseGPRMC(const char* sentence) {
  char field[20];

  // 필드 2: 상태 확인 (A = 유효, V = 무효)
  getNmeaField(field, sentence, 2);
  if (strcmp(field, "A") != 0) {
    // 유효하지 않은 데이터 — 위성 신호 수신 중
    if (hasFix) {
      // 픽스를 잃은 경우에만 한 번 출력
      Serial.println("[GPS] 위성 신호 약함 — 픽스 없음 (수신 중...)");
      hasFix = false;
    }
    return;
  }

  // ---- 위도 파싱 ----
  getNmeaField(field, sentence, 3);  // 위도값 (DDMM.MMMM)
  if (field[0] == '\0') return;
  float lat = nmeaCoordToDecimal(field);

  getNmeaField(field, sentence, 4);  // N(북위) 또는 S(남위)
  if (strcmp(field, "S") == 0) lat = -lat;  // 남위는 음수

  // ---- 경도 파싱 ----
  getNmeaField(field, sentence, 5);  // 경도값 (DDDMM.MMMM)
  if (field[0] == '\0') return;
  float lon = nmeaCoordToDecimal(field);

  getNmeaField(field, sentence, 6);  // E(동경) 또는 W(서경)
  if (strcmp(field, "W") == 0) lon = -lon;  // 서경은 음수

  // ---- 속도 파싱 ----
  getNmeaField(field, sentence, 7);  // 속도 (노트 단위)
  float speedKnots = atof(field);
  float speedKmh   = speedKnots * 1.852f;  // 노트 → km/h 변환

  // ---- 결과 저장 및 출력 ----
  lastLatitude  = lat;
  lastLongitude = lon;
  lastSpeedKmh  = speedKmh;
  hasFix        = true;

  Serial.println("-----------------------------");
  Serial.print("[GPS] 위도  : ");
  Serial.print(lat, 6);
  Serial.println("°");
  Serial.print("[GPS] 경도  : ");
  Serial.print(lon, 6);
  Serial.println("°");
  Serial.print("[GPS] 속도  : ");
  Serial.print(speedKmh, 1);
  Serial.println(" km/h");
  Serial.println("-----------------------------");
}

// ----------------------------------------------------------------
// 한 줄의 NMEA 문장 처리
// ----------------------------------------------------------------
void processNmeaSentence(const char* sentence) {
  // $GPRMC 문장만 처리 (나머지는 무시)
  if (strncmp(sentence, "$GPRMC", 6) == 0) {
    parseGPRMC(sentence);
  }
  // $GPGGA, $GPGSV, $GPVTG 등 다른 문장은 무시
}

void setup() {
  // UART0: USB를 통해 PC 시리얼 모니터와 연결
  Serial.begin(BAUD_RATE);
  delay(500);

  // UART1: GPS 모듈 (G20=RX, G21=TX, 9600 baud)
  Serial1.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  Serial.println("================================");
  Serial.println("  GPS NMEA 파싱 예제");
  Serial.println("================================");
  Serial.print("GPS 핀: RX=G");
  Serial.print(GPS_RX_PIN);
  Serial.print(" (GPS TX 연결), TX=G");
  Serial.print(GPS_TX_PIN);
  Serial.println();
  Serial.print("GPS 속도: ");
  Serial.print(GPS_BAUD);
  Serial.println(" baud");
  Serial.println();
  Serial.println("GPS 없이 테스트하려면 시리얼 모니터에 아래 문장을 입력하세요:");
  Serial.println("$GPRMC,123519,A,3731.500,N,12659.000,E,000.0,000.0,070426,,,A*68");
  Serial.println();
  Serial.println("GPS 모듈 연결 시 실외에서 위성 픽스를 기다리세요...");
  Serial.println();
}

void loop() {
  // ---- GPS 모듈(UART1)에서 NMEA 문장 수신 ----
  while (Serial1.available() > 0) {
    char c = Serial1.read();

    if (c == '$') {
      // 새 문장 시작 — 버퍼를 초기화하고 '$'부터 저장
      nmeaIndex = 0;
      nmeaBuffer[nmeaIndex++] = c;

    } else if (c == '\n') {
      // 줄바꿈 — 문장 완성, 파싱 실행
      nmeaBuffer[nmeaIndex] = '\0';
      if (nmeaIndex > 1) {
        processNmeaSentence(nmeaBuffer);
      }
      nmeaIndex = 0;

    } else if (c != '\r') {
      // 일반 문자 저장 (캐리지리턴은 무시, 버퍼 오버플로우 방지)
      if (nmeaIndex < NMEA_BUFFER_SIZE - 1) {
        nmeaBuffer[nmeaIndex++] = c;
      }
    }
  }

  // ---- GPS 없을 때: 시리얼 모니터 직접 입력으로 테스트 ----
  // 시리얼 모니터에서 NMEA 문장을 입력하면 파싱 결과를 확인할 수 있습니다
  if (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '$') {
      nmeaIndex = 0;
      nmeaBuffer[nmeaIndex++] = c;
    } else if (c == '\n') {
      nmeaBuffer[nmeaIndex] = '\0';
      if (nmeaIndex > 1) {
        Serial.print("[시리얼 입력] ");
        Serial.println(nmeaBuffer);
        processNmeaSentence(nmeaBuffer);
      }
      nmeaIndex = 0;
    } else if (c != '\r') {
      if (nmeaIndex < NMEA_BUFFER_SIZE - 1) {
        nmeaBuffer[nmeaIndex++] = c;
      }
    }
  }
}
