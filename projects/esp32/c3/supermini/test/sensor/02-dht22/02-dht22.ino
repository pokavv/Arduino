/*
 * [핵심 개념] DHT22 온습도 센서 (DHT11 개선판)
 * ===============================================
 * DHT22(AM2302)는 DHT11과 동일한 단선 디지털 통신을 사용하지만
 * 훨씬 높은 정확도와 넓은 측정 범위를 가집니다.
 *
 * DHT11 vs DHT22 비교:
 * ┌──────────────┬────────────────┬─────────────────────┐
 * │ 항목         │ DHT11          │ DHT22 (AM2302)      │
 * ├──────────────┼────────────────┼─────────────────────┤
 * │ 온도 범위    │ 0 ~ 50°C       │ -40 ~ 80°C          │
 * │ 온도 정확도  │ ±2°C           │ ±0.5°C              │
 * │ 습도 범위    │ 20 ~ 90%       │ 0 ~ 100%            │
 * │ 습도 정확도  │ ±5%            │ ±2~5%               │
 * │ 샘플링 주기  │ 1초            │ 2초                 │
 * │ 가격         │ 저렴           │ 약간 비쌈           │
 * └──────────────┴────────────────┴─────────────────────┘
 *
 * DHT22 사용 용도:
 *   - 정밀 온습도 측정이 필요한 경우
 *   - 영하 온도 측정이 필요한 경우 (냉장고, 외부 환경)
 *   - DHT11로 정확도가 부족할 때
 *
 * 코드는 DHT11과 거의 동일합니다.
 * DHT_TYPE만 DHT22로 바꾸면 됩니다.
 *
 * [라이브러리]
 *   - DHT sensor library by Adafruit
 *   - Adafruit Unified Sensor
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - DHT22 (AM2302) 센서
 *   - 10kΩ 저항 (단품일 경우)
 *
 * [연결 방법]
 *   DHT22 모듈형 (3핀):
 *     VCC  → 3.3V
 *     DATA → G2
 *     GND  → GND
 *
 *   DHT22 단품 (4핀, 왼쪽부터):
 *     1번 핀 (VCC)  → 3.3V
 *     2번 핀 (DATA) → G2
 *     3번 핀        → 연결 안 함 (NC)
 *     4번 핀 (GND)  → GND
 *     DATA(G2)와 VCC(3.3V) 사이에 10kΩ 저항 연결 권장
 */

#include <DHT.h>
#include "config.h"

// DHT 객체 생성: config.h에서 DHT_TYPE = DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// 읽기 타이머
unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);
  Serial.println("==========================");
  Serial.println("DHT22 온습도 센서 예제");
  Serial.println("==========================");
  Serial.println("센서 타입: DHT22 (AM2302)");
  Serial.println("정확도: 온도 ±0.5°C, 습도 ±2~5%");
  Serial.println("데이터 핀: G" + String(DHT_PIN));
  Serial.println("읽기 주기: " + String(READ_INTERVAL / 1000) + "초");
  Serial.println("--------------------------");
  Serial.println("온도(°C) | 습도(%) | 체감온도(°C)");
  Serial.println("--------------------------");

  dht.begin();

  // DHT22 안정화 대기 (첫 읽기 전 2초 이상)
  delay(2000);
}

void loop() {
  unsigned long now = millis();

  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;
    readAndPrintDHT();
  }
}

// -----------------------------------------------
// DHT22 읽기 및 출력
// -----------------------------------------------
void readAndPrintDHT() {
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  // 읽기 실패 확인 (isnan = NaN 체크)
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[오류] DHT22 읽기 실패!");
    Serial.println("  확인: 연결 핀, 10kΩ 풀업 저항, 최소 2초 간격");
    return;
  }

  // 화씨 변환 (필요시)
  float tempF = dht.readTemperature(true);  // true = 화씨

  // 체감온도 (섭씨 기준)
  float heatIndex = dht.computeHeatIndex(temperature, humidity, false);

  // 결과 출력
  Serial.print(temperature, 1);
  Serial.print("°C    | ");
  Serial.print(humidity, 1);
  Serial.print("%     | ");
  Serial.print(heatIndex, 1);
  Serial.println("°C");

  // DHT22는 영하 측정 가능
  if (temperature < 0) {
    Serial.println("  → 영하 온도 측정 중 (DHT22 특기!)");
  }
}
