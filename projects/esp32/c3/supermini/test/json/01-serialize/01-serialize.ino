/*
 * json/01-serialize — ArduinoJson 직렬화 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   JSON (JavaScript Object Notation)
 *     - 사람이 읽기 쉽고 컴퓨터가 파싱하기 쉬운 데이터 형식
 *     - Web API, MQTT, HTTP 통신에서 표준으로 사용
 *
 *   직렬화 (Serialization)
 *     - 프로그램 내부 데이터(변수, 구조체)를 전송 가능한 문자열로 변환
 *     - C++ 변수 → JSON 문자열
 *     - 예: int temp = 25 → {"temperature": 25, "unit": "C"}
 *
 *   ArduinoJson 라이브러리
 *     - Arduino용 JSON 처리 라이브러리
 *     - JsonDocument: JSON 데이터를 담는 컨테이너
 *     - serializeJson(): 문서를 JSON 문자열로 변환
 *     - serializeJsonPretty(): 들여쓰기 포함 (사람이 읽기 좋음)
 *
 * [라이브러리]
 *   ArduinoJson (Benoit Blanchon)
 *   설치: 라이브러리 매니저 → "ArduinoJson" 검색 → 설치
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"
#include <ArduinoJson.h>   // ArduinoJson 라이브러리

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ArduinoJson 직렬화 예제");
  Serial.println("===================================");
  Serial.println();

  // ========================================
  // 예제 1: 간단한 센서 데이터 JSON
  // ========================================
  Serial.println("--- 예제1: 센서 데이터 ---");
  {
    JsonDocument doc;  // JSON 문서 생성 (ArduinoJson v7: 크기 자동 관리)

    // 키-값 쌍 추가
    doc["device"]      = "ESP32-C3";    // 문자열 값
    doc["temperature"] = 25.6f;         // 실수 값
    doc["humidity"]    = 60;            // 정수 값
    doc["online"]      = true;          // 불리언 값

    // JSON 문자열로 직렬화 (한 줄 출력)
    Serial.print("한 줄 JSON: ");
    serializeJson(doc, Serial);         // Serial에 직접 출력
    Serial.println();

    // 들여쓰기 포함 출력 (디버그 시 가독성 좋음)
    Serial.println("예쁜 JSON:");
    serializeJsonPretty(doc, Serial);
    Serial.println();

    // 문자열 변수에 저장하는 방법
    String jsonStr;
    serializeJson(doc, jsonStr);
    Serial.print("String 변수에 저장: ");
    Serial.println(jsonStr);
  }

  // ========================================
  // 예제 2: 중첩 객체 (Nested Object)
  // ========================================
  Serial.println("--- 예제2: 중첩 객체 ---");
  {
    JsonDocument doc;

    // 중첩 객체 생성
    JsonObject location = doc["location"].to<JsonObject>();
    location["city"]    = "Seoul";
    location["lat"]     = 37.5665f;
    location["lng"]     = 126.9780f;

    doc["name"]         = "기상 센서 #1";
    doc["active"]       = true;

    serializeJsonPretty(doc, Serial);
    Serial.println();
  }

  // ========================================
  // 예제 3: 배열 포함
  // ========================================
  Serial.println("--- 예제3: 배열 포함 ---");
  {
    JsonDocument doc;

    doc["sensor"] = "ADC";

    // 배열 추가
    JsonArray readings = doc["readings"].to<JsonArray>();
    readings.add(1024);
    readings.add(1087);
    readings.add(1100);
    readings.add(1053);

    serializeJsonPretty(doc, Serial);
    Serial.println();
  }

  Serial.println("===================================");
  Serial.println("직렬화 완료");
}

void loop() {
  delay(1000);
}
