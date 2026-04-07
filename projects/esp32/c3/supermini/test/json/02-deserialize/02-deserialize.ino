/*
 * json/02-deserialize — ArduinoJson 역직렬화 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   역직렬화 (Deserialization)
 *     - JSON 문자열을 프로그램이 사용할 수 있는 내부 데이터로 변환
 *     - JSON 문자열 → C++ 변수
 *     - 예: {"temperature": 25, "unit": "C"} → int temp = 25
 *
 *   deserializeJson() 반환값 확인
 *     - 성공: DeserializationError::Ok
 *     - 실패: 구체적인 오류 코드 (메모리 부족, JSON 형식 오류 등)
 *     - 항상 반환값을 확인하는 습관을 가져야 함
 *
 *   이 예제 사용법
 *     - 시리얼 모니터에서 JSON 문자열을 입력하면 파싱해서 출력
 *     - 예시 입력: {"name":"ESP32","temp":25.5,"active":true}
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
 *   시리얼 모니터 설정: 줄 끝 = "Newline" 또는 "Both NL & CR"
 */

#include "config.h"
#include <ArduinoJson.h>

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ArduinoJson 역직렬화 예제");
  Serial.println("===================================");
  Serial.println("시리얼 모니터에 JSON 문자열을 입력하세요.");
  Serial.println("예시: {\"name\":\"ESP32\",\"temp\":25.5,\"active\":true}");
  Serial.println();

  // ---- 내장 예제로 먼저 시연 ----
  Serial.println("--- 내장 예제 파싱 시연 ---");
  const char* sampleJson = "{\"device\":\"ESP32-C3\",\"temperature\":25.6,\"humidity\":60,\"online\":true,\"readings\":[100,200,300]}";
  parseAndPrint(sampleJson);

  Serial.println();
  Serial.println("이제 직접 JSON을 입력해보세요:");
}

void loop() {
  // 시리얼로 한 줄 입력 대기
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');  // 줄바꿈 전까지 읽기
    input.trim();  // 앞뒤 공백/줄바꿈 제거

    if (input.length() > 0) {
      Serial.println("--- 입력 받은 JSON 파싱 ---");
      parseAndPrint(input.c_str());
    }
  }
}

// ---- JSON 파싱 및 출력 함수 ----
void parseAndPrint(const char* jsonStr) {
  Serial.print("입력 문자열: ");
  Serial.println(jsonStr);

  JsonDocument doc;  // JSON 문서 컨테이너

  // ---- 역직렬화 실행 ----
  DeserializationError error = deserializeJson(doc, jsonStr);

  // ---- 오류 확인 ----
  if (error) {
    Serial.print("[오류] JSON 파싱 실패: ");
    Serial.println(error.c_str());  // 오류 메시지 출력
    return;
  }

  Serial.println("[성공] JSON 파싱 완료!");
  Serial.println("파싱 결과:");

  // ---- 값 추출 및 타입 확인 ----
  // as<T>(): 원하는 타입으로 변환
  // isNull(): 키가 없거나 null인지 확인

  if (!doc["device"].isNull()) {
    Serial.print("  device (문자열): ");
    Serial.println(doc["device"].as<const char*>());
  }

  if (!doc["name"].isNull()) {
    Serial.print("  name (문자열): ");
    Serial.println(doc["name"].as<const char*>());
  }

  if (!doc["temperature"].isNull()) {
    Serial.print("  temperature (실수): ");
    Serial.println(doc["temperature"].as<float>(), 1);
  }

  if (!doc["temp"].isNull()) {
    Serial.print("  temp (실수): ");
    Serial.println(doc["temp"].as<float>(), 1);
  }

  if (!doc["humidity"].isNull()) {
    Serial.print("  humidity (정수): ");
    Serial.println(doc["humidity"].as<int>());
  }

  if (!doc["online"].isNull()) {
    Serial.print("  online (불리언): ");
    Serial.println(doc["online"].as<bool>() ? "true" : "false");
  }

  if (!doc["active"].isNull()) {
    Serial.print("  active (불리언): ");
    Serial.println(doc["active"].as<bool>() ? "true" : "false");
  }

  // 배열 파싱
  if (!doc["readings"].isNull()) {
    JsonArray arr = doc["readings"].as<JsonArray>();
    Serial.print("  readings (배열, 크기 ");
    Serial.print(arr.size());
    Serial.print("): ");
    for (int val : arr) {
      Serial.print(val);
      Serial.print(" ");
    }
    Serial.println();
  }

  Serial.println();
}
