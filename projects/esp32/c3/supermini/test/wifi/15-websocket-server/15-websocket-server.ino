/**
 * @file  15-websocket-server.ino
 * @brief WebSocket 서버 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * WebSocket vs HTTP:
 * - HTTP: 클라이언트가 요청할 때만 서버가 응답 (단방향)
 * - WebSocket: 연결 후 서버와 클라이언트가 언제든 데이터 송수신 (양방향)
 *   채팅, 실시간 센서 데이터, 게임 등에 적합
 *
 * WebSocket 동작 흐름:
 * 1. 클라이언트가 HTTP로 업그레이드 요청 (Upgrade: websocket)
 * 2. 서버가 승인하면 WebSocket 연결 수립
 * 3. 이후 양방향 실시간 통신
 *
 * 이벤트 종류:
 * - WS_EVT_CONNECT    : 클라이언트 연결
 * - WS_EVT_DISCONNECT : 클라이언트 연결 해제
 * - WS_EVT_DATA       : 메시지 수신
 * - WS_EVT_ERROR      : 오류 발생
 *
 * 브로드캐스트:
 * - ws.textAll("메시지") → 연결된 모든 클라이언트에 전송
 * ---------------------------------------------------------------
 * [라이브러리]
 * - ESPAsyncWebServer + AsyncTCP (GitHub: me-no-dev)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * ---------------------------------------------------------------
 * [연결 방법]
 * - secrets.h 에 Wi-Fi 정보 입력
 * - 브라우저에서 http://[IP] 접속 → 내장 WebSocket 클라이언트 사용
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 전역 객체
// ---------------------------------------------------------------
AsyncWebServer server(WEB_PORT);
AsyncWebSocket ws("/ws");   // "/ws" 경로에 WebSocket 서버 생성

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void onWebSocketEvent(AsyncWebSocket *server,
                      AsyncWebSocketClient *client,
                      AwsEventType type,
                      void *arg, uint8_t *data, size_t len);

// 주기적 메시지 전송 타이머
unsigned long lastBroadcastMs = 0;

// ---------------------------------------------------------------
// setup(): 초기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== WebSocket 서버 =====");

    if (!connectWiFi()) {
        Serial.println("[오류] Wi-Fi 연결 실패");
        return;
    }

    // WebSocket 이벤트 핸들러 등록
    ws.onEvent(onWebSocketEvent);

    // 서버에 WebSocket 추가
    server.addHandler(&ws);

    // 웹 페이지 (WebSocket 테스트용 HTML 포함)
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        String html = R"rawhtml(
<!DOCTYPE html><html lang='ko'>
<head><meta charset='UTF-8'><title>WebSocket</title>
<style>body{font-family:sans-serif;margin:20px;}
#log{border:1px solid #ccc;padding:10px;height:200px;overflow-y:auto;background:#f9f9f9;}
input{width:70%;padding:8px;} button{padding:8px 16px;}
</style></head>
<body>
<h2>WebSocket 테스트</h2>
<div id='status'>연결 중...</div>
<div id='log'></div>
<br>
<input id='msg' type='text' placeholder='메시지 입력'>
<button onclick='sendMsg()'>전송</button>
<script>
var ws = new WebSocket('ws://' + location.host + '/ws');
ws.onopen    = function(){ document.getElementById('status').innerText='연결됨'; };
ws.onclose   = function(){ document.getElementById('status').innerText='연결 끊김'; };
ws.onmessage = function(e){
    var log = document.getElementById('log');
    log.innerHTML += '<p>[수신] ' + e.data + '</p>';
    log.scrollTop = log.scrollHeight;
};
function sendMsg(){
    var input = document.getElementById('msg');
    if(input.value){ ws.send(input.value); input.value=''; }
}
</script>
</body></html>)rawhtml";
        request->send(200, "text/html; charset=utf-8", html);
    });

    server.begin();
    Serial.printf("[서버] http://%s 로 접속하세요\n",
                  WiFi.localIP().toString().c_str());
}

// ---------------------------------------------------------------
// loop(): 주기적으로 모든 클라이언트에 메시지 브로드캐스트
// ---------------------------------------------------------------
void loop() {
    // 끊긴 클라이언트 정리 (메모리 해제)
    if (millis() - lastBroadcastMs >= WS_CLEANUP_MS) {
        lastBroadcastMs = millis();
        ws.cleanupClients();

        // 연결된 클라이언트가 있으면 주기적 메시지 전송
        if (ws.count() > 0) {
            String msg = "서버 시간: " + String(millis() / 1000) + "초";
            ws.textAll(msg);
        }
    }
}

// ---------------------------------------------------------------
// connectWiFi(): Wi-Fi 연결
// ---------------------------------------------------------------
bool connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.printf("[Wi-Fi] %s 연결 중", WIFI_SSID);

    unsigned long startMs = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startMs >= WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println(" 실패!");
            return false;
        }
        delay(500);
        Serial.print(".");
    }
    Serial.printf(" 완료! IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
}

// ---------------------------------------------------------------
// onWebSocketEvent(): WebSocket 이벤트 처리 함수
// ---------------------------------------------------------------
void onWebSocketEvent(AsyncWebSocket *server,
                      AsyncWebSocketClient *client,
                      AwsEventType type,
                      void *arg, uint8_t *data, size_t len) {
    switch (type) {
        case WS_EVT_CONNECT:
            Serial.printf("[WS] 클라이언트 연결 - ID: %u  IP: %s\n",
                          client->id(),
                          client->remoteIP().toString().c_str());
            client->text("ESP32-C3에 연결됐습니다!");
            break;

        case WS_EVT_DISCONNECT:
            Serial.printf("[WS] 클라이언트 연결 해제 - ID: %u\n", client->id());
            break;

        case WS_EVT_DATA: {
            // 수신 메시지를 문자열로 변환
            AwsFrameInfo *info = (AwsFrameInfo*)arg;
            if (info->opcode == WS_TEXT) {
                String message = "";
                for (size_t i = 0; i < len; i++) {
                    message += (char)data[i];
                }
                Serial.printf("[WS] 수신 - ID:%u  메시지: %s\n",
                              client->id(), message.c_str());

                // 수신한 메시지를 모든 클라이언트에 브로드캐스트
                String broadcast = "[ID:" + String(client->id()) + "] " + message;
                server->textAll(broadcast);
            }
            break;
        }

        case WS_EVT_ERROR:
            Serial.printf("[WS] 오류 - ID: %u\n", client->id());
            break;

        default:
            break;
    }
}
