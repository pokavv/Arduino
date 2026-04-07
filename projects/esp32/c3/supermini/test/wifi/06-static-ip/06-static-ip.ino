/**
 * @file  06-static-ip.ino
 * @brief Wi-Fi 고정 IP 설정 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * 동적 IP(DHCP)와 고정 IP(Static IP):
 * - DHCP: 공유기가 자동으로 IP를 할당 (매번 바뀔 수 있음)
 * - 고정 IP: 항상 같은 IP 주소를 사용하도록 수동 설정
 *
 * 고정 IP가 필요한 경우:
 * - ESP32를 서버로 사용할 때 (IP가 바뀌면 클라이언트가 못 찾음)
 * - 스마트폰 앱에서 항상 같은 IP로 접속해야 할 때
 *
 * WiFi.config() 매개변수:
 * - ip      : ESP32에 할당할 IP 주소
 * - gateway : 공유기(게이트웨이) IP 주소
 * - subnet  : 서브넷 마스크 (보통 255.255.255.0)
 * - dns1    : DNS 서버 주소 (인터넷 도메인 해석용)
 *
 * 중요: WiFi.config()는 WiFi.begin() 전에 호출해야 합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 2.4GHz Wi-Fi 공유기
 * ---------------------------------------------------------------
 * [연결 방법]
 * - config.h 에서 STATIC_IP, GATEWAY, SUBNET을 공유기 환경에 맞게 수정
 * - secrets.h 에 Wi-Fi 정보 입력
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWithStaticIP();
void printIPConfig();

// ---------------------------------------------------------------
// setup(): 고정 IP로 Wi-Fi 연결
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== Wi-Fi 고정 IP 설정 =====");

    if (connectWithStaticIP()) {
        printIPConfig();
    } else {
        Serial.println("[오류] 연결 실패");
    }
}

// ---------------------------------------------------------------
// loop(): 상태 주기 출력
// ---------------------------------------------------------------
void loop() {
    Serial.printf("[상태] IP: %s  RSSI: %d dBm\n",
                  WiFi.localIP().toString().c_str(),
                  WiFi.RSSI());
    delay(5000);
}

// ---------------------------------------------------------------
// connectWithStaticIP(): 고정 IP로 Wi-Fi에 연결합니다.
// ---------------------------------------------------------------
bool connectWithStaticIP() {
    // IPAddress 객체로 IP 주소 파싱
    IPAddress staticIP, gateway, subnet, dns1, dns2;
    staticIP.fromString(STATIC_IP);
    gateway.fromString(GATEWAY);
    subnet.fromString(SUBNET);
    dns1.fromString(DNS1);
    dns2.fromString(DNS2);

    // 고정 IP 설정 (WiFi.begin() 전에 반드시 호출)
    if (!WiFi.config(staticIP, gateway, subnet, dns1, dns2)) {
        Serial.println("[오류] 고정 IP 설정 실패");
        return false;
    }

    Serial.printf("[IP 설정] %s (고정)\n", STATIC_IP);

    // Wi-Fi 연결
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    Serial.printf("[연결] %s 접속 중", WIFI_SSID);
    unsigned long startMs = millis();

    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startMs >= WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println();
            return false;
        }
        delay(500);
        Serial.print(".");
    }

    Serial.println(" 완료!");
    return true;
}

// ---------------------------------------------------------------
// printIPConfig(): IP 설정 정보를 출력합니다.
// ---------------------------------------------------------------
void printIPConfig() {
    Serial.println("----------------------------");
    Serial.printf("  설정 IP   : %s\n", STATIC_IP);
    Serial.printf("  실제 IP   : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  게이트웨이 : %s\n", WiFi.gatewayIP().toString().c_str());
    Serial.printf("  서브넷    : %s\n", WiFi.subnetMask().toString().c_str());
    Serial.println("----------------------------");

    // 설정한 IP와 실제 할당된 IP가 같은지 확인
    if (WiFi.localIP().toString() == String(STATIC_IP)) {
        Serial.println("[확인] 고정 IP 적용 성공!");
    } else {
        Serial.println("[경고] IP 불일치 - 공유기 설정 확인 필요");
    }
}
