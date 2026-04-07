#pragma once

// ===== API URL =====
// 테스트용 공개 JSON API (실제 서버, 인터넷 연결 필요)
#define API_URL "http://jsonplaceholder.typicode.com/todos/1"

// ===== HTTP 타임아웃 =====
#define HTTP_TIMEOUT_MS 5000   // HTTP 응답 대기 최대 시간 (5초)

// ===== JSON 버퍼 크기 =====
#define JSON_DOC_SIZE 512      // API 응답 JSON 파싱 버퍼

// ===== 요청 주기 =====
#define REQUEST_INTERVAL 10000 // API 호출 주기 (ms) — 10초마다
