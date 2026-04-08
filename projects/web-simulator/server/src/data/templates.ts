export interface CircuitTemplate {
  id: string;
  name: string;
  category: string;
  boardId: string;
  description: string;
  components: object[];
  code: string;
}

export const TEMPLATES: CircuitTemplate[] = [
  {
    id: 'blink',
    name: 'Blink',
    category: 'GPIO',
    boardId: 'arduino-uno',
    description: '내장 LED 깜빡이기 (Hello World)',
    components: [
      {
        id: 'board', type: 'board-uno', x: 100, y: 100,
        props: {}, connections: {},
      },
      {
        id: 'led1', type: 'led', x: 320, y: 100,
        props: { color: 'red' },
        connections: { ANODE: 13, CATHODE: 'GND' },
      },
      {
        id: 'r1', type: 'resistor', x: 260, y: 100,
        props: { ohms: 220 },
        connections: { PIN1: 13, PIN2: 'led1.ANODE' },
      },
    ],
    code: `// Blink — 내장 LED 깜빡이기
// LED_BUILTIN 핀(13번)의 LED를 1초 간격으로 켜고 끕니다.

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);  // 핀을 출력으로 설정
  Serial.begin(115200);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // LED 켜기
  Serial.println("LED ON");
  delay(1000);

  digitalWrite(LED_BUILTIN, LOW);   // LED 끄기
  Serial.println("LED OFF");
  delay(1000);
}
`,
  },
  {
    id: 'blink-esp32c3',
    name: 'Blink (ESP32-C3)',
    category: 'GPIO',
    boardId: 'esp32-c3-supermini',
    description: 'ESP32-C3 Super Mini 내장 LED (G8, Active LOW)',
    components: [
      {
        id: 'board', type: 'board-esp32c3', x: 100, y: 100,
        props: {}, connections: {},
      },
    ],
    code: `// ESP32-C3 Super Mini Blink
// 내장 LED는 G8에 연결, Active LOW (LOW=켜짐)

#define LED_PIN 8

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32-C3 Blink!");
}

void loop() {
  digitalWrite(LED_PIN, LOW);   // 켜기 (Active LOW)
  Serial.println("ON");
  delay(500);

  digitalWrite(LED_PIN, HIGH);  // 끄기
  Serial.println("OFF");
  delay(500);
}
`,
  },
  {
    id: 'button-led',
    name: 'Button + LED',
    category: 'GPIO',
    boardId: 'arduino-uno',
    description: '버튼을 누르면 LED가 켜집니다',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'btn1', type: 'button', x: 300, y: 80,
        props: {},
        connections: { PIN1A: 2, PIN2A: 'GND' },
      },
      {
        id: 'led1', type: 'led', x: 300, y: 180,
        props: { color: 'green' },
        connections: { ANODE: 13, CATHODE: 'GND' },
      },
    ],
    code: `// 버튼으로 LED 제어
// 버튼(D2)을 누르면 LED(D13)가 켜집니다

const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);  // 내부 풀업
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int state = digitalRead(BUTTON_PIN);

  if (state == LOW) {  // 버튼 눌림 (Active LOW)
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button pressed!");
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(10);
}
`,
  },
  {
    id: 'pwm-fade',
    name: 'PWM Fade',
    category: 'GPIO',
    boardId: 'arduino-uno',
    description: 'PWM으로 LED 밝기 서서히 변경',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'led1', type: 'led', x: 320, y: 80,
        props: { color: 'blue' },
        connections: { ANODE: 9, CATHODE: 'GND' },
      },
      {
        id: 'r1', type: 'resistor', x: 260, y: 80,
        props: { ohms: 220 },
        connections: { PIN1: 9, PIN2: 'led1.ANODE' },
      },
    ],
    code: `// PWM Fade — LED 밝기를 부드럽게 변경
// D9 (PWM 지원 핀)에 LED 연결

const int LED_PIN = 9;
int brightness = 0;
int fadeAmount = 5;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  analogWrite(LED_PIN, brightness);

  brightness += fadeAmount;
  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;
  }

  delay(30);
}
`,
  },
  {
    id: 'dht22',
    name: 'DHT22 온습도',
    category: 'Sensor',
    boardId: 'arduino-uno',
    description: 'DHT22로 온도/습도 읽기',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'dht1', type: 'dht', x: 340, y: 80,
        props: { model: 'DHT22', temperature: 25, humidity: 60 },
        connections: { VCC: '5V', DATA: 2, GND: 'GND' },
      },
    ],
    code: `// DHT22 온습도 센서 예제
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  Serial.println("DHT22 시작");
}

void loop() {
  delay(2000);

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("센서 읽기 실패!");
    return;
  }

  Serial.print("습도: ");
  Serial.print(humidity);
  Serial.print(" %  온도: ");
  Serial.print(temperature);
  Serial.println(" °C");
}
`,
  },
  {
    id: 'servo',
    name: '서보 모터',
    category: 'Actuator',
    boardId: 'arduino-uno',
    description: '서보 모터 스윕 (0~180도)',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'servo1', type: 'servo', x: 340, y: 80,
        props: { angle: 90 },
        connections: { VCC: '5V', GND: 'GND', SIGNAL: 9 },
      },
    ],
    code: `// 서보 모터 스윕
#include <Servo.h>

Servo myServo;
const int SERVO_PIN = 9;

void setup() {
  myServo.attach(SERVO_PIN);
  Serial.begin(9600);
}

void loop() {
  // 0도 → 180도
  for (int angle = 0; angle <= 180; angle++) {
    myServo.write(angle);
    Serial.print("각도: ");
    Serial.println(angle);
    delay(15);
  }

  // 180도 → 0도
  for (int angle = 180; angle >= 0; angle--) {
    myServo.write(angle);
    delay(15);
  }
}
`,
  },
  {
    id: 'lcd-hello',
    name: 'LCD Hello World',
    category: 'Display',
    boardId: 'arduino-uno',
    description: 'I2C LCD에 Hello World 출력',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'lcd1', type: 'lcd', x: 340, y: 80,
        props: { rows: 2, cols: 16, i2cAddress: 0x27 },
        connections: { VCC: '5V', GND: 'GND', SDA: 18, SCL: 19 },
      },
    ],
    code: `// I2C LCD Hello World
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Hello, World!");
  lcd.setCursor(0, 1);
  lcd.print("Arduino Sim");
}

void loop() {
  // 시간 카운터 표시
  lcd.setCursor(10, 1);
  lcd.print(millis() / 1000);
  lcd.print("s  ");
  delay(1000);
}
`,
  },
  {
    id: 'neopixel',
    name: 'NeoPixel Rainbow',
    category: 'LED',
    boardId: 'arduino-uno',
    description: 'NeoPixel 스트립 무지개 애니메이션',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'neo1', type: 'neopixel', x: 340, y: 80,
        props: { count: 8 },
        connections: { VCC: '5V', GND: 'GND', DIN: 6 },
      },
    ],
    code: `// NeoPixel 무지개
#include <Adafruit_NeoPixel.h>

#define PIN 6
#define NUM_LEDS 8

Adafruit_NeoPixel strip(NUM_LEDS, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  strip.begin();
  strip.setBrightness(50);
  strip.show();
}

void loop() {
  for (int hue = 0; hue < 65536; hue += 512) {
    for (int i = 0; i < strip.numPixels(); i++) {
      int pixelHue = hue + (i * 65536L / strip.numPixels());
      strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(pixelHue)));
    }
    strip.show();
    delay(10);
  }
}
`,
  },
  {
    id: 'ultrasonic',
    name: '초음파 거리 센서',
    category: 'Sensor',
    boardId: 'arduino-uno',
    description: 'HC-SR04 거리 측정',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'us1', type: 'ultrasonic', x: 340, y: 80,
        props: { distanceCm: 20 },
        connections: { VCC: '5V', TRIG: 9, ECHO: 10, GND: 'GND' },
      },
    ],
    code: `// HC-SR04 초음파 거리 센서
#define TRIG_PIN 9
#define ECHO_PIN 10

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.begin(9600);
}

void loop() {
  // 트리거 펄스 발생
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 에코 시간 측정
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;

  Serial.print("거리: ");
  Serial.print(distance);
  Serial.println(" cm");

  delay(500);
}
`,
  },
];
