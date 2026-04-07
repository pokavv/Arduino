#pragma once

// ===== 웹 서버 포트 =====
#define WEB_PORT 80         // HTTP 기본 포트 (80번이면 브라우저에서 포트 생략 가능)

// ===== ADC 핀 =====
#define ADC_PIN 0           // G0 = ADC1_CH0 (주의: G0은 부팅핀, 부팅 완료 후 사용)

// ===== JSON 버퍼 크기 =====
#define JSON_DOC_SIZE 256   // JSON 직렬화에 사용할 메모리 크기 (바이트)
