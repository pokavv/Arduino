/*
 * [핵심 개념] SD 카드 센서 데이터 로거
 * =======================================
 * 센서 값을 일정 주기로 SD 카드에 CSV 파일로 저장합니다.
 * 데이터 로거(Data Logger)는 IoT 프로젝트에서 자주 사용됩니다.
 *
 * CSV (Comma-Separated Values) 형식:
 *   각 데이터를 쉼표로 구분한 텍스트 파일
 *   엑셀/스프레드시트에서 바로 열 수 있음
 *   예: 12345,2048,1.65
 *       millis,adc_raw,voltage
 *
 * FILE_APPEND 모드:
 *   기존 파일을 지우지 않고 끝에 추가
 *   부팅 후에도 이전 데이터가 남아있음
 *
 * millis() 기반 논블로킹:
 *   delay() 대신 millis()로 시간을 재면
 *   SD 쓰기 중에도 다른 작업을 할 수 있음
 *
 * [라이브러리]
 *   - SD (Arduino 기본 라이브러리)
 *   - SPI (Arduino 기본 라이브러리)
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - SD 카드 모듈 + microSD 카드 (FAT32 포맷)
 *   - 가변저항 10kΩ 또는 아날로그 센서
 *
 * [연결 방법]
 *   SD 모듈: MOSI→G6, MISO→G5, SCK→G4, CS→G7, VCC→3.3V, GND→GND
 *   가변저항: 왼쪽→GND, 가운데→G0, 오른쪽→3.3V
 */

#include <SPI.h>
#include <SD.h>
#include "config.h"

// 로그 타이머
unsigned long lastLogTime = 0;

// 로그 횟수 카운터
unsigned long logCount = 0;

// SD 카드 초기화 성공 여부
bool sdReady = false;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);
  Serial.println("==========================");
  Serial.println("SD 카드 센서 로거 시작");
  Serial.println("==========================");

  // ADC 핀 설정
  pinMode(ADC_PIN, INPUT);

  // SPI + SD 카드 초기화
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);

  if (!SD.begin(SD_CS)) {
    Serial.println("[오류] SD 카드 초기화 실패!");
    Serial.println("SD 카드 없이 시리얼 출력만 진행합니다.");
    sdReady = false;
  } else {
    Serial.println("[성공] SD 카드 초기화 완료!");
    sdReady = true;

    // CSV 헤더 쓰기 (파일이 새로 생성되는 경우에만)
    writeCSVHeader();
  }

  Serial.println("로그 시작 (주기: " + String(LOG_INTERVAL / 1000) + "초)");
  Serial.println("파일 경로: " + String(LOG_FILE));
  Serial.println("---");
  Serial.println("millis,adc_raw,voltage_v");
}

void loop() {
  unsigned long now = millis();

  // LOG_INTERVAL마다 로그 기록
  if (now - lastLogTime >= LOG_INTERVAL) {
    lastLogTime = now;

    // 센서 값 읽기 (4회 평균)
    int adcValue = readAdcSmoothed();

    // 전압 계산 (3.3V 기준)
    float voltage = (float)adcValue / 4095.0 * 3.3;

    // 시리얼에 출력
    logCount++;
    Serial.print("[");
    Serial.print(logCount);
    Serial.print("] ");
    Serial.print(now);
    Serial.print("ms | ADC: ");
    Serial.print(adcValue);
    Serial.print(" | V: ");
    Serial.print(voltage, 2);
    Serial.println("V");

    // SD 카드에 기록
    if (sdReady) {
      writeCSVRow(now, adcValue, voltage);
    }
  }
}

// -----------------------------------------------
// ADC 스무딩: 4번 읽어 평균
// -----------------------------------------------
int readAdcSmoothed() {
  long sum = 0;
  const int samples = 4;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(ADC_PIN);
  }
  return (int)(sum / samples);
}

// -----------------------------------------------
// CSV 헤더 쓰기 (파일이 없을 때만)
// -----------------------------------------------
void writeCSVHeader() {
  // 파일이 이미 있으면 헤더를 다시 쓰지 않음 (이어쓰기 모드)
  if (SD.exists(LOG_FILE)) {
    Serial.println("[알림] 기존 파일에 이어서 기록합니다: " + String(LOG_FILE));
    return;
  }

  // 새 파일 생성하고 헤더 작성
  File file = SD.open(LOG_FILE, FILE_WRITE);
  if (file) {
    // CSV 헤더 줄 작성
    file.println("millis_ms,adc_raw,voltage_v");
    file.close();
    Serial.println("[성공] CSV 헤더 작성 완료: " + String(LOG_FILE));
  } else {
    Serial.println("[오류] 파일 생성 실패: " + String(LOG_FILE));
    sdReady = false;
  }
}

// -----------------------------------------------
// CSV 데이터 행 추가 (FILE_APPEND 모드)
// -----------------------------------------------
void writeCSVRow(unsigned long timestamp, int adcValue, float voltage) {
  // FILE_APPEND: 파일 끝에 이어쓰기 (기존 데이터 보존)
  File file = SD.open(LOG_FILE, FILE_APPEND);

  if (!file) {
    Serial.println("[오류] 파일 열기 실패! SD 카드를 확인하세요.");
    sdReady = false;
    return;
  }

  // CSV 한 줄 작성: millis,adc,voltage
  file.print(timestamp);
  file.print(",");
  file.print(adcValue);
  file.print(",");
  file.println(voltage, 2);  // 소수점 2자리

  file.close();  // 반드시 닫아야 데이터가 실제로 저장됨
}
