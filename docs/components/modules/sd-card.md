# SD / MicroSD 카드 모듈 (SPI)

## 개요

SD/MicroSD 카드 모듈은 Arduino와 SD 또는 MicroSD 카드를 SPI 인터페이스로 연결해주는 브레이크아웃 보드입니다.
내부에 SD 카드 전용 레벨 변환 IC와 전압 레귤레이터가 포함되어 있어
5V Arduino와 3.3V SD 카드 사이의 전압 차이를 해결해 줍니다.

Arduino 프로젝트에서의 활용:
- 센서 데이터 장기 기록 (온도, 습도, 압력 로깅)
- 파일 시스템 (설정 파일 읽기/쓰기, config.json 저장)
- 오디오 재생 데이터 소스 (WAV 파일)
- 이미지 디스플레이 소스
- 대용량 데이터 오프로드 (Wi-Fi 없는 환경에서 데이터 수집 후 PC 전송)

---

## 모델 비교 표

| 모델 | SD 타입 | 전원 | 주요 IC | 특징 |
|------|---------|------|---------|------|
| 표준 SD 모듈 | Full-size SD | 3.3~5V | 74LVC125 레벨 변환 | 가장 흔함 |
| MicroSD 모듈 (소형) | MicroSD | 3.3~5V | 전압 변환 IC 내장 | 소형, 저렴 |
| MicroSD 모듈 (고급) | MicroSD | 3.3~5V | 레벨 변환 + 3.3V LDO | 안정적 |
| Adafruit MicroSD | MicroSD | 3.3~5.5V | SN74LVC2T45 | 고품질 |
| SparkFun MicroSD | MicroSD | 3.3~5V | CD74HC4050 | 안정적 레벨 변환 |

---

## 핀 구성

### 표준 6핀 MicroSD 모듈

```
[ GND ] [ VCC ] [ MISO ] [ MOSI ] [ SCK ] [ CS ]
  핀1     핀2     핀3      핀4      핀5     핀6
```

| 핀 | 이름 | 방향 | 기능 |
|----|------|------|------|
| 1 | GND | 전원 | 공통 접지 |
| 2 | VCC | 전원 | 전원 입력 (3.3V~5V) |
| 3 | MISO | 출력 | SPI 데이터 출력 (SD → Arduino) |
| 4 | MOSI | 입력 | SPI 데이터 입력 (Arduino → SD) |
| 5 | SCK | 입력 | SPI 클럭 |
| 6 | CS (SS) | 입력 | SPI 칩 선택 (LOW = 활성) |

---

## 전기적 / 물리적 스펙 표

### SD 카드 모듈 (브레이크아웃 보드)

| 항목 | 값 | 단위 |
|------|-----|------|
| 전원 전압 | 3.3 ~ 5 | V |
| SD 카드 전원 | 3.3 | V (내부 레귤레이터) |
| SPI 신호 전압 (입력) | 3.3 ~ 5 | V (레벨 변환 내장) |
| SPI 최대 클럭 | 25 | MHz |
| 권장 SPI 클럭 | 4 ~ 8 | MHz |
| 대기 전류 | 약 0.2 | mA |
| 읽기 전류 | 약 100 | mA |
| 쓰기 전류 | 약 150 | mA |
| 크기 (소형 MicroSD) | 약 25 × 20 | mm |

### SD 카드 자체 스펙 (참고)

| 항목 | SD | SDHC | SDXC |
|------|-----|------|------|
| 최대 용량 | 2GB | 32GB | 2TB |
| 파일 시스템 | FAT16 | FAT32 | exFAT |
| Arduino 지원 | O | O (4~32GB) | 제한적 |
| SPI 모드 | 지원 | 지원 | 일부 지원 |

> Arduino SD 라이브러리는 FAT16/FAT32를 지원합니다. 32GB 이하 Class 10 MicroSDHC 카드를 권장합니다.

### 속도 등급

| 등급 | 최소 쓰기 속도 |
|------|--------------|
| Class 2 | 2 MB/s |
| Class 4 | 4 MB/s |
| Class 6 | 6 MB/s |
| Class 10 | 10 MB/s |
| UHS-I (U1) | 10 MB/s |
| UHS-I (U3) | 30 MB/s |

---

## 동작 원리

### SPI 모드 통신

SD 카드는 기본적으로 SD 버스 프로토콜을 사용하지만, SPI 모드로도 동작합니다.
Arduino에서는 SPI 모드를 사용합니다.

```
SPI 통신 흐름:
1. CS(SS) 핀 LOW → SD 카드 활성화
2. Arduino가 SCK 클럭 발생
3. MOSI: Arduino → SD 카드 (명령, 데이터)
4. MISO: SD 카드 → Arduino (응답, 데이터)
5. CS HIGH → SD 카드 비활성화
```

### FAT 파일 시스템

SD 라이브러리는 내부적으로 SdFat 라이브러리를 사용하여 FAT16/FAT32를 해석합니다.
파일 생성, 삭제, 읽기, 쓰기, 디렉토리 탐색이 가능합니다.

---

## 아두이노 연결 방법

### Arduino Uno와 연결

```
SD 모듈 VCC  ──── Arduino 5V
SD 모듈 GND  ──── Arduino GND
SD 모듈 MISO ──── Arduino 핀 12 (SPI MISO)
SD 모듈 MOSI ──── Arduino 핀 11 (SPI MOSI)
SD 모듈 SCK  ──── Arduino 핀 13 (SPI SCK)
SD 모듈 CS   ──── Arduino 핀 4 (임의 디지털 핀)
```

### ESP32-C3 Super Mini와 연결

```
SD 모듈 VCC  ──── ESP32-C3 3V3 (또는 5V 가능한 모듈)
SD 모듈 GND  ──── GND
SD 모듈 MISO ──── GPIO2  (SPI MISO)
SD 모듈 MOSI ──── GPIO7  (SPI MOSI)
SD 모듈 SCK  ──── GPIO6  (SPI SCK)
SD 모듈 CS   ──── GPIO10 (임의 GPIO)
```

---

## 설정 방법 (SD 라이브러리)

### 라이브러리

```cpp
// Arduino IDE 기본 내장 라이브러리 사용
#include <SPI.h>
#include <SD.h>
```

### SD 카드 초기화

```cpp
#include <SPI.h>
#include <SD.h>

const int CS_PIN = 4;  // CS 핀 번호

void setup() {
    Serial.begin(115200);

    // SPI 핀은 자동으로 설정됨 (하드웨어 SPI)
    if (!SD.begin(CS_PIN)) {
        Serial.println("SD 카드 초기화 실패!");
        Serial.println("확인사항:");
        Serial.println("  1. SD 카드 삽입 여부");
        Serial.println("  2. 배선 연결 확인");
        Serial.println("  3. CS 핀 번호 확인");
        while (true);  // 멈춤
    }
    Serial.println("SD 카드 초기화 성공!");
}
```

### 파일 쓰기 (데이터 로깅)

```cpp
#include <SPI.h>
#include <SD.h>

const int CS_PIN = 4;

void logData(float temperature, float humidity) {
    // 파일 열기 (없으면 생성, FILE_WRITE = 추가 쓰기)
    File logFile = SD.open("log.csv", FILE_WRITE);

    if (logFile) {
        // CSV 형식으로 기록
        logFile.print(millis());
        logFile.print(",");
        logFile.print(temperature, 2);
        logFile.print(",");
        logFile.println(humidity, 2);
        logFile.close();  // 반드시 닫아야 데이터가 저장됨!
        Serial.println("기록 완료");
    } else {
        Serial.println("파일 열기 실패!");
    }
}

void setup() {
    Serial.begin(115200);
    SD.begin(CS_PIN);

    // 헤더 작성 (파일이 없을 때만)
    if (!SD.exists("log.csv")) {
        File f = SD.open("log.csv", FILE_WRITE);
        f.println("시간(ms),온도(C),습도(%)");
        f.close();
    }
}

void loop() {
    float temp = 25.5;  // 센서에서 읽은 값으로 대체
    float hum  = 60.0;
    logData(temp, hum);
    delay(5000);  // 5초마다 기록
}
```

### 파일 읽기

```cpp
void readConfig() {
    File configFile = SD.open("config.txt");
    if (configFile) {
        Serial.println("config.txt 내용:");
        while (configFile.available()) {
            Serial.write(configFile.read());
        }
        configFile.close();
    } else {
        Serial.println("config.txt 없음");
    }
}
```

### 파일 목록 출력

```cpp
void listFiles(File dir, int depth = 0) {
    while (true) {
        File entry = dir.openNextFile();
        if (!entry) break;

        for (int i = 0; i < depth; i++) Serial.print("  ");
        Serial.print(entry.name());

        if (entry.isDirectory()) {
            Serial.println("/");
            listFiles(entry, depth + 1);
        } else {
            Serial.print("  ");
            Serial.print(entry.size());
            Serial.println(" bytes");
        }
        entry.close();
    }
}

void setup() {
    Serial.begin(115200);
    SD.begin(CS_PIN);
    File root = SD.open("/");
    listFiles(root);
    root.close();
}
```

### 파일 삭제

```cpp
if (SD.exists("old_log.csv")) {
    SD.remove("old_log.csv");
    Serial.println("파일 삭제 완료");
}
```

---

## 주의사항

1. **파일 반드시 close()**: `file.close()` 없이 전원을 끊으면 파일이 손상되거나 데이터가 기록되지 않습니다.
2. **FAT32 포맷 필수**: exFAT(64GB 이상)은 Arduino SD 라이브러리에서 지원하지 않습니다. 64GB 이상 카드는 FAT32로 재포맷 후 사용.
3. **SPI 충돌 주의**: 동일 SPI 버스에 여러 장치(SD + 디스플레이 + nRF24L01 등) 연결 시 각각의 CS 핀을 다르게 설정하고, 한 번에 하나만 활성화.
4. **8.3 파일명 제한**: 표준 SD 라이브러리는 8.3 파일명 형식(최대 8자 이름 + 3자 확장자)만 지원. 긴 파일명은 SdFat 라이브러리로 해결.
5. **전류 소비 주의**: 쓰기 시 150mA 소비. Arduino 3.3V 핀(50mA 제한)에서 직접 공급 시 전류 부족. 5V 핀 또는 외부 3.3V 레귤레이터 사용.
6. **SD 카드 품질**: 저렴한 불량 카드는 초기화 실패, 데이터 손실이 잦습니다. 정품 SanDisk, Samsung 카드 권장.
7. **핫플러그 금지**: 전원이 켜진 상태에서 SD 카드를 삽입/제거하면 파일 시스템 손상 위험.

---

## 실사용 팁 및 회로 패턴

### 고속 SPI 설정 (ESP32)

```cpp
#include <SPI.h>
#include <SD.h>

SPIClass spi(HSPI);  // ESP32 HSPI 버스

void setup() {
    spi.begin(SCK_PIN, MISO_PIN, MOSI_PIN, CS_PIN);
    if (!SD.begin(CS_PIN, spi, 8000000)) {  // 8MHz
        Serial.println("SD 초기화 실패");
    }
}
```

### 타임스탬프 포함 로깅 (RTC 연동)

```cpp
#include <RTClib.h>

RTC_DS3231 rtc;

void logWithTimestamp(float value) {
    DateTime now = rtc.now();
    File f = SD.open("data.csv", FILE_WRITE);
    if (f) {
        f.print(now.year());   f.print("/");
        f.print(now.month());  f.print("/");
        f.print(now.day());    f.print(" ");
        f.print(now.hour());   f.print(":");
        f.print(now.minute()); f.print(":");
        f.print(now.second()); f.print(",");
        f.println(value, 3);
        f.close();
    }
}
```

### 로그 파일 크기 관리

```cpp
const long MAX_LOG_SIZE = 1024 * 1024;  // 1MB 제한

void rotateLog() {
    File f = SD.open("log.csv");
    if (f && f.size() > MAX_LOG_SIZE) {
        f.close();
        SD.remove("log_old.csv");
        // 파일 이름 변경은 표준 SD 라이브러리 미지원
        // → 새 이름으로 복사 후 원본 삭제 방식 필요
    }
}
```

### 여러 SPI 장치와 공유 사용

```cpp
const int CS_SD      = 4;
const int CS_DISPLAY = 5;
const int CS_NRF     = 6;

// SD 사용 전
digitalWrite(CS_DISPLAY, HIGH);  // 다른 장치 비활성화
digitalWrite(CS_NRF, HIGH);
// SD.begin()은 CS_SD를 자동 관리
SD.open(...);

// nRF24 사용 전
// RF24 라이브러리가 CS_NRF를 자동 관리
```
