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
    name: 'Blink (LED 깜빡이기)',
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
    name: '버튼으로 LED 제어',
    category: 'GPIO',
    boardId: 'arduino-uno',
    description: '버튼을 누르면 LED가 켜지는 기본 회로',
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
    name: 'DHT22 온습도 측정',
    category: '센서',
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
    name: '서보 모터 (기본)',
    category: '모터',
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
    category: '디스플레이',
    boardId: 'arduino-uno',
    description: 'I2C LCD에 Hello World 출력',
    components: [
      { id: 'board', type: 'board-uno', x: 80, y: 80, props: {}, connections: {} },
      {
        id: 'lcd1', type: 'lcd', x: 340, y: 80,
        props: { rows: 2, cols: 16, i2cAddress: 0x27 },
        connections: { VCC: '5V', GND: 'GND', SDA: 'A4', SCL: 'A5' },
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
    name: 'NeoPixel (기본)',
    category: 'NeoPixel',
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
    category: '센서',
    boardId: 'arduino-uno',
    description: 'HC-SR04 거리 측정',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'ultrasonic-1', type: 'ultrasonic', x: 360, y: 100,
        rotation: 0,
        props: { distanceCm: 20 },
        connections: { VCC: '5V', TRIG: 9, ECHO: 10, GND: 'GND' },
      },
    ],
    code: `// HC-SR04 초음파 거리 센서
// 초음파를 발사하고 돌아오는 시간으로 거리를 계산합니다
// 회로: TRIG → D9, ECHO → D10, VCC → 5V, GND → GND

#define TRIG_PIN 9
#define ECHO_PIN 10

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.begin(9600);
  Serial.println("HC-SR04 초음파 거리 센서 시작!");
}

void loop() {
  // 트리거 핀을 10마이크로초 동안 HIGH로 설정해 초음파 발사
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 에코 핀에서 반사 시간 측정 (마이크로초)
  long duration = pulseIn(ECHO_PIN, HIGH);
  // 거리(cm) = 왕복 시간 × 음속(0.034cm/μs) ÷ 2
  float distance = duration * 0.034 / 2;

  Serial.print("거리: ");
  Serial.print(distance);
  Serial.println(" cm");

  delay(500);
}
`,
  },
  {
    id: 'fade',
    name: 'LED 페이드 인/아웃',
    category: 'GPIO',
    boardId: 'arduino-uno',
    description: 'analogWrite로 LED 밝기를 부드럽게 변경 (페이드 인/아웃)',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'resistor-1', type: 'resistor', x: 320, y: 120,
        rotation: 0,
        props: { ohms: 220 },
        connections: { PIN1: 9, PIN2: 'led-1.ANODE' },
      },
      {
        id: 'led-1', type: 'led', x: 420, y: 100,
        rotation: 0,
        props: { color: 'blue' },
        connections: { ANODE: 'resistor-1.PIN2', CATHODE: 'GND' },
      },
    ],
    code: `// LED 페이드 인/아웃
// PWM 신호로 LED 밝기를 0에서 255까지 부드럽게 변경합니다
// 회로: D9(PWM) → 220Ω → LED → GND

const int LED_PIN = 9;   // PWM 지원 핀 (3, 5, 6, 9, 10, 11)
int brightness = 0;       // 현재 밝기 (0~255)
int fadeAmount = 5;       // 밝기 변화량

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("LED 페이드 시작!");
}

void loop() {
  // 현재 밝기로 PWM 출력
  analogWrite(LED_PIN, brightness);

  // 밝기 값 증가/감소
  brightness += fadeAmount;

  // 밝기가 최대(255) 또는 최소(0)에 도달하면 방향 반전
  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;
  }

  Serial.print("밝기: ");
  Serial.println(brightness);
  delay(30);
}
`,
  },
  {
    id: 'potentiometer-led',
    name: '가변저항으로 LED 밝기 제어',
    category: '아날로그',
    boardId: 'arduino-uno',
    description: '가변저항을 돌려 LED 밝기를 조절합니다',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'potentiometer-1', type: 'potentiometer', x: 340, y: 80,
        rotation: 0,
        props: { value: 512 },
        connections: { VCC: '5V', GND: 'GND', WIPER: 'A0' },
      },
      {
        id: 'resistor-1', type: 'resistor', x: 340, y: 200,
        rotation: 0,
        props: { ohms: 220 },
        connections: { PIN1: 9, PIN2: 'led-1.ANODE' },
      },
      {
        id: 'led-1', type: 'led', x: 450, y: 180,
        rotation: 0,
        props: { color: 'yellow' },
        connections: { ANODE: 'resistor-1.PIN2', CATHODE: 'GND' },
      },
    ],
    code: `// 가변저항으로 LED 밝기 제어
// 가변저항(A0)의 값을 읽어 LED(D9) 밝기로 변환합니다
// 회로: 가변저항 WIPER → A0, D9 → 220Ω → LED → GND

const int POT_PIN = A0;  // 가변저항 아날로그 핀
const int LED_PIN = 9;   // PWM 지원 핀

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("가변저항 LED 밝기 제어 시작!");
}

void loop() {
  // 가변저항 값 읽기 (0~1023, 10비트 ADC)
  int potValue = analogRead(POT_PIN);

  // 가변저항 범위(0~1023)를 PWM 범위(0~255)로 변환
  int ledBrightness = map(potValue, 0, 1023, 0, 255);

  // LED 밝기 적용
  analogWrite(LED_PIN, ledBrightness);

  Serial.print("가변저항: ");
  Serial.print(potValue);
  Serial.print("  LED 밝기: ");
  Serial.println(ledBrightness);

  delay(50);
}
`,
  },
  {
    id: 'potentiometer-serial',
    name: '가변저항 값 시리얼 출력',
    category: '아날로그',
    boardId: 'arduino-uno',
    description: '가변저항을 돌리면서 아날로그 값을 시리얼 모니터로 확인합니다',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'potentiometer-1', type: 'potentiometer', x: 360, y: 100,
        rotation: 0,
        props: { value: 512 },
        connections: { VCC: '5V', GND: 'GND', WIPER: 'A0' },
      },
    ],
    code: `// 가변저항 값 시리얼 출력
// 가변저항을 돌리면서 아날로그 값을 실시간으로 확인합니다
// 회로: 가변저항 VCC → 5V, GND → GND, WIPER → A0

const int POT_PIN = A0;  // 가변저항 연결 핀

void setup() {
  Serial.begin(9600);
  Serial.println("가변저항 시리얼 출력 시작!");
  Serial.println("가변저항을 돌려보세요.");
}

void loop() {
  // 아날로그 값 읽기 (0~1023)
  int rawValue = analogRead(POT_PIN);

  // 전압으로 변환 (5V 기준)
  float voltage = rawValue * (5.0 / 1023.0);

  // 백분율로 변환
  int percentage = map(rawValue, 0, 1023, 0, 100);

  Serial.print("원시값: ");
  Serial.print(rawValue);
  Serial.print("  전압: ");
  Serial.print(voltage, 2);
  Serial.print("V  비율: ");
  Serial.print(percentage);
  Serial.println("%");

  delay(200);
}
`,
  },
  {
    id: 'buzzer-tone',
    name: '부저 멜로디 (도레미)',
    category: '소리',
    boardId: 'arduino-uno',
    description: 'tone()으로 도레미파솔라시도 멜로디를 재생합니다',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'buzzer-1', type: 'buzzer', x: 360, y: 100,
        rotation: 0,
        props: {},
        connections: { PIN: 8, GND: 'GND' },
      },
    ],
    code: `// 부저 멜로디 재생 — 도레미파솔라시도
// tone() 함수로 각 음계의 주파수를 발생시킵니다
// 회로: D8 → 부저 양극(+), GND → 부저 음극(-)

const int BUZZER_PIN = 8;

// 음계 주파수 (Hz)
const int NOTE_C4 = 262;  // 도
const int NOTE_D4 = 294;  // 레
const int NOTE_E4 = 330;  // 미
const int NOTE_F4 = 349;  // 파
const int NOTE_G4 = 392;  // 솔
const int NOTE_A4 = 440;  // 라
const int NOTE_B4 = 494;  // 시
const int NOTE_C5 = 523;  // 높은 도

// 멜로디 배열
int melody[] = { NOTE_C4, NOTE_D4, NOTE_E4, NOTE_F4, NOTE_G4, NOTE_A4, NOTE_B4, NOTE_C5 };
const char* noteNames[] = { "도", "레", "미", "파", "솔", "라", "시", "도(높은)" };
const int NOTE_COUNT = 8;
const int NOTE_DURATION = 400;  // 음표 길이 (ms)

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("도레미파솔라시도 멜로디 시작!");
}

void loop() {
  // 각 음계 순서대로 재생
  for (int i = 0; i < NOTE_COUNT; i++) {
    Serial.print("♪ ");
    Serial.println(noteNames[i]);
    tone(BUZZER_PIN, melody[i], NOTE_DURATION);
    delay(NOTE_DURATION + 50);  // 음표 길이 + 짧은 묵음
  }

  noTone(BUZZER_PIN);
  Serial.println("--- 반복 ---");
  delay(1000);  // 1초 쉬고 반복
}
`,
  },
  {
    id: 'servo-sweep',
    name: '서보 모터 스윕',
    category: '모터',
    boardId: 'arduino-uno',
    description: '서보 모터가 0도에서 180도까지 자동으로 스윕합니다',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'servo-1', type: 'servo', x: 360, y: 100,
        rotation: 0,
        props: { angle: 90 },
        connections: { VCC: '5V', GND: 'GND', SIGNAL: 9 },
      },
    ],
    code: `// 서보 모터 자동 스윕
// 서보 모터가 0도 → 180도 → 0도를 반복합니다
// 회로: 주황(신호) → D9, 빨강(VCC) → 5V, 갈색(GND) → GND

#include <Servo.h>

Servo myServo;             // 서보 객체 생성
const int SERVO_PIN = 9;   // 서보 신호 핀

void setup() {
  myServo.attach(SERVO_PIN);  // 서보를 D9 핀에 연결
  Serial.begin(9600);
  Serial.println("서보 모터 스윕 시작!");
}

void loop() {
  // 0도 → 180도 (정방향 스윕)
  Serial.println("→ 0도에서 180도로");
  for (int angle = 0; angle <= 180; angle++) {
    myServo.write(angle);
    Serial.print("각도: ");
    Serial.println(angle);
    delay(15);
  }

  delay(500);

  // 180도 → 0도 (역방향 스윕)
  Serial.println("← 180도에서 0도로");
  for (int angle = 180; angle >= 0; angle--) {
    myServo.write(angle);
    delay(15);
  }

  delay(500);
}
`,
  },
  {
    id: 'rgb-led',
    name: 'RGB LED 색상 사이클',
    category: 'RGB',
    boardId: 'arduino-uno',
    description: 'RGB LED가 빨강→초록→파랑→보라→노랑→하늘색 순으로 색을 바꿉니다',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'rgb-led-1', type: 'rgb-led', x: 380, y: 100,
        rotation: 0,
        props: {},
        connections: { R: 9, G: 10, B: 11, CATHODE: 'GND' },
      },
      {
        id: 'resistor-1', type: 'resistor', x: 300, y: 80,
        rotation: 0,
        props: { ohms: 220 },
        connections: { PIN1: 9, PIN2: 'rgb-led-1.R' },
      },
      {
        id: 'resistor-2', type: 'resistor', x: 300, y: 130,
        rotation: 0,
        props: { ohms: 220 },
        connections: { PIN1: 10, PIN2: 'rgb-led-1.G' },
      },
      {
        id: 'resistor-3', type: 'resistor', x: 300, y: 180,
        rotation: 0,
        props: { ohms: 220 },
        connections: { PIN1: 11, PIN2: 'rgb-led-1.B' },
      },
    ],
    code: `// RGB LED 색상 사이클
// 빨강, 초록, 파랑을 혼합해 다양한 색상을 만듭니다
// 회로: R → 220Ω → D9, G → 220Ω → D10, B → 220Ω → D11, 공통음극 → GND

const int RED_PIN   = 9;   // 빨강 PWM 핀
const int GREEN_PIN = 10;  // 초록 PWM 핀
const int BLUE_PIN  = 11;  // 파랑 PWM 핀

// RGB 값으로 색상 설정하는 함수
void setColor(int red, int green, int blue) {
  analogWrite(RED_PIN,   red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN,  blue);
}

void setup() {
  pinMode(RED_PIN,   OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN,  OUTPUT);
  Serial.begin(9600);
  Serial.println("RGB LED 색상 사이클 시작!");
}

void loop() {
  // 기본 색상 사이클
  Serial.println("빨강");
  setColor(255, 0, 0);
  delay(800);

  Serial.println("초록");
  setColor(0, 255, 0);
  delay(800);

  Serial.println("파랑");
  setColor(0, 0, 255);
  delay(800);

  Serial.println("보라 (빨강+파랑)");
  setColor(255, 0, 255);
  delay(800);

  Serial.println("노랑 (빨강+초록)");
  setColor(255, 255, 0);
  delay(800);

  Serial.println("하늘색 (초록+파랑)");
  setColor(0, 255, 255);
  delay(800);

  Serial.println("흰색 (모두 켜기)");
  setColor(255, 255, 255);
  delay(800);

  Serial.println("꺼짐");
  setColor(0, 0, 0);
  delay(400);
}
`,
  },
  {
    id: 'neopixel-rainbow',
    name: 'NeoPixel 무지개 애니메이션',
    category: 'NeoPixel',
    boardId: 'arduino-uno',
    description: 'NeoPixel 스트립에 무지개 색상이 흘러가는 애니메이션을 표시합니다',
    components: [
      { id: 'board-1', type: 'board-uno', x: 100, y: 100, rotation: 0, props: {}, connections: {} },
      {
        id: 'neopixel-1', type: 'neopixel', x: 360, y: 100,
        rotation: 0,
        props: { count: 8 },
        connections: { VCC: '5V', GND: 'GND', DIN: 6 },
      },
    ],
    code: `// NeoPixel 무지개 애니메이션
// WS2812B NeoPixel 8개에 무지개 색상이 흘러갑니다
// 회로: DIN → D6, VCC → 5V, GND → GND (데이터 선에 470Ω 저항 권장)

#include <Adafruit_NeoPixel.h>

#define LED_PIN    6   // NeoPixel 데이터 핀
#define LED_COUNT  8   // NeoPixel 개수

// NeoPixel 객체 생성 (개수, 핀, 타입)
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  strip.begin();              // NeoPixel 초기화
  strip.setBrightness(50);    // 밝기 설정 (0~255, 50은 약 20%)
  strip.show();               // 초기 상태 적용 (모두 꺼짐)
  Serial.begin(9600);
  Serial.println("NeoPixel 무지개 시작!");
}

void loop() {
  // 전체 색상환(0~65535)을 순회하며 무지개 표시
  for (long firstPixelHue = 0; firstPixelHue < 5 * 65536; firstPixelHue += 256) {
    for (int i = 0; i < strip.numPixels(); i++) {
      // 각 픽셀마다 색상 위상을 다르게 설정 → 무지개 효과
      long pixelHue = firstPixelHue + (i * 65536L / strip.numPixels());
      strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(pixelHue)));
    }
    strip.show();
    delay(10);
  }
}
`,
  },
];
