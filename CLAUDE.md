# CLAUDE.md — Arduino Web Simulator

Arduino 코드를 웹 브라우저에서 완전히 시뮬레이션하는 도구입니다.
Wokwi / TinkerCAD Circuits / Proteus 수준의 완성도를 목표로 합니다.

---

## 프로젝트 목표

- **모든 Arduino 보드** 지원 (Uno, Nano, Mega, ESP32, ESP32-C3, ESP8266)
- **모든 부품** 시각적·동작적으로 현실과 동일하게 시뮬레이션
- **모든 라이브러리** (DHT, Servo, Wire, SPI, FastLED, …) 코드 그대로 동작
- **무한 캔버스** — 팬/줌/드래그, 와이어 연결, 다중 부품 동시 배치
- **코드 에디터** — Monaco (VSCode 기반), Arduino C++ 문법 강조
- **시리얼 모니터** — `Serial.print()` 출력 실시간 표시

---

## 디렉토리 구조

```
web-simulator/
├── index.html                      # 진입점 (스크립트 로드 순서 중요)
├── CLAUDE.md                       # 이 파일
└── src/
    ├── css/
    │   └── app.css                 # 전체 UI 스타일
    └── js/
        ├── core/                   # 시뮬레이터 엔진
        │   ├── scheduler.js        # millis/delay 스케줄러 (태스크 큐)
        │   ├── runtime.js          # Arduino GPIO/ADC/PWM/Serial/인터럽트
        │   ├── transpiler.js       # C++ → JavaScript 변환기
        │   └── (app.js SimulatorEngine 클래스 포함)
        ├── boards/                 # 보드 정의
        │   ├── BoardBase.js        # 추상 기반 클래스
        │   ├── ArduinoUno.js
        │   ├── ArduinoNano.js
        │   ├── ArduinoMega.js
        │   ├── ESP32.js
        │   ├── ESP32C3.js
        │   ├── ESP8266.js
        │   └── boards.js           # window.BOARDS 레지스트리
        ├── circuit/
        │   └── circuit.js          # SVG 캔버스 (팬/줌/드래그/와이어)
        ├── components/             # 부품 정의 (카테고리별 분리)
        │   ├── ComponentBase.js    # 기반 클래스
        │   ├── base.js             # ComponentRegistry, SvgUtil, _pinLabel
        │   ├── output.js           # LED, LED_RGB, LED_Bar, Buzzer, Speaker, Relay
        │   ├── display.js          # LCD_1602, LCD_2004, OLED_SSD1306, TM1637, SevenSeg
        │   ├── input.js            # Button, Switch, Potentiometer, Joystick, Keypad, IRReceiver
        │   ├── sensor.js           # DHT11/22, DS18B20, 초음파, PIR, CDS, MQ2, MPU6050, ...
        │   ├── motor.js            # Servo, DC_Motor, DC_Motor_L298N, Stepper_28BYJ48
        │   ├── communication.js    # Bluetooth_HC05, WiFi_ESP8266, RFID_RC522, NRF24L01
        │   ├── passive.js          # Resistor, Capacitor, NPN_Transistor, Diode
        │   ├── rgb.js              # RGB_WS2812B, RGB_WS2812B_Strip
        │   └── power.js            # PowerRail, GndRail, BreadboardSection
        ├── libraries/              # Arduino 라이브러리 시뮬레이션
        │   ├── Wire.js             # I2C
        │   ├── SPI.js              # SPI
        │   ├── Servo.js            # 서보 제어
        │   ├── LiquidCrystal.js    # LCD (parallel)
        │   ├── LiquidCrystal_I2C.js # LCD (I2C)
        │   ├── Adafruit_SSD1306.js # OLED 128x64
        │   ├── DHT.js              # DHT11/DHT22 온습도
        │   ├── OneWire.js          # 1-Wire 프로토콜
        │   ├── DallasTemperature.js # DS18B20 온도
        │   ├── NewPing.js          # HC-SR04 초음파
        │   ├── FastLED.js          # WS2812B (FastLED + NeoPixel 겸용)
        │   ├── Stepper.js          # 스텝 모터
        │   ├── IRremote.js         # 적외선 송수신
        │   ├── Keypad.js           # 4x4 키패드
        │   ├── SoftwareSerial.js   # 소프트웨어 시리얼
        │   ├── EEPROM.js           # EEPROM 시뮬레이션
        │   └── math_functions.js   # Arduino 수학 함수
        └── ui/
            ├── app.js              # 메인 UI 컨트롤러 + SimulatorEngine
            └── (templates.js는 src/templates/에 있음)
```

---

## 핵심 아키텍처

### 스크립트 로드 순서 (index.html)
```
1. 보드 정의 (BoardBase → 각 보드 → boards.js 레지스트리)
2. 엔진 코어 (scheduler → runtime → transpiler)
3. 컴포넌트 (ComponentBase → base.js → 카테고리별)
4. 회로 편집기 (circuit.js)
5. 템플릿 (templates.js)
6. 라이브러리 (math → Wire → SPI → ... → FastLED → Stepper)
7. 앱 진입점 (app.js)
```

### 시뮬레이션 흐름
```
[Monaco 에디터 C++ 코드]
    ↓ Transpiler.transpile()
[JavaScript 코드 (async/await)]
    ↓ new Function(...globals, body)
[샌드박스 실행]
    ↓ digitalWrite/analogRead 등
[ArduinoRuntime]
    ↓ onGpioChange / onPwmChange / getAdcValue
[Circuit 컴포넌트들]
    ↓ SVG 업데이트
[화면에 반영]
```

### 라이브러리 → 컴포넌트 연결 패턴
라이브러리는 `window.currentCircuit.getAllComponents()`로 컴포넌트를 찾아 연결합니다:
```javascript
// 예: DHT 라이브러리가 DHT11 컴포넌트를 pin으로 찾는 방법
const components = window.currentCircuit?.getAllComponents?.() || [];
const dhtComp = components.find(c =>
    (c.type === 'DHT11' || c.type === 'DHT22') &&
    c.connections['DATA'] === this._pin
);
```

---

## 컴포넌트 추가 방법

### 1. 새 컴포넌트 클래스 작성
```javascript
function MyComponent(id, config) {
    config = config || {};
    ComponentBase.call(this, id, 'MyComponent', config);
    // 상태 초기화
}
MyComponent.prototype = Object.create(ComponentBase.prototype);
MyComponent.prototype.constructor = MyComponent;

MyComponent.prototype.createSvg = function() {
    var g = SvgUtil.el('g', { id: this.id, 'class': 'component component-my' });
    // SVG 요소 추가
    // 핀 추가: SvgUtil.pinDot(x, y, 'PIN_NAME', this.id, 'digital')
    this.element = g;
    return g;
};
MyComponent.prototype.getConnectionPoints = function() {
    return [{ name: 'SIG', x: 10, y: 20, type: 'digital' }];
};
MyComponent.prototype.getBoundingBox = function() {
    return { x: 0, y: 0, width: 60, height: 40 };
};
// GPIO 변화 콜백
MyComponent.prototype.onGpioChange = function(pin, value) { /* ... */ };
// ADC 읽기 콜백
MyComponent.prototype.getAdcValue = function(pin) { return 0; };

ComponentRegistry.register('MyComponent', MyComponent);
```

### 2. 적절한 카테고리 파일에 추가
- 출력 부품 → `output.js`
- 센서 → `sensor.js`
- 모터 → `motor.js`
- 기타 → 해당 카테고리

### 3. index.html 팔레트에 추가
```html
<div class="palette-item" data-type="MyComponent" draggable="true">
    <span class="palette-icon">🔌</span><span>내 부품</span>
</div>
```

---

## 라이브러리 추가 방법

### 1. `src/js/libraries/MyLib.js` 생성
```javascript
(function(global) {
    function MyClass(pin) {
        this._pin = pin;
    }
    MyClass.prototype.begin = function() { /* ... */ };
    MyClass.prototype.read = function() {
        // 컴포넌트 찾아서 값 반환
        var comps = global.currentCircuit?.getAllComponents?.() || [];
        var comp = comps.find(c => c.connections['DATA'] === this._pin);
        return comp ? comp.readValue() : 0;
    };

    if (typeof global !== 'undefined') {
        global.MyLib = { MyClass };
        global.MyClass = MyClass;
    }
})(typeof window !== 'undefined' ? window : this);
```

### 2. `index.html`에 스크립트 태그 추가 (5번 라이브러리 섹션)
```html
<script src="src/js/libraries/MyLib.js"></script>
```

### 3. `app.js` `_buildGlobals()`에 등록
```javascript
MyClass: window.MyLib ? window.MyLib.MyClass : null,
```

---

## 보드 추가 방법

### 1. `src/js/boards/MyBoard.js` 생성 (`BoardBase` 상속)
### 2. `src/js/boards/boards.js`의 `window.BOARDS`에 등록
### 3. `index.html` 스크립트 태그 추가 (1번 보드 섹션)

---

## 트랜스파일러 핵심 변환 규칙

| C++ | JavaScript |
|-----|-----------|
| `int x = 5;` | `let x = 5;` |
| `DHT dht(9, DHT11);` | `let dht = new DHT(9, DHT11);` |
| `Servo sv;` | `let sv = new Servo();` |
| `delay(100);` | `await _delay(100);` |
| `Serial.println(x);` | `_Serial.println(x);` |
| `(int)x` | `Math.trunc(x)` |
| `F("str")` | `"str"` |

---

## 주의사항

- **컴포넌트 connections**: `{ 'PIN_NAME': gpioNumber }` 형식으로, 라이브러리가 핀 번호로 컴포넌트를 찾을 때 사용
- **Active LOW**: ESP32-C3/ESP8266 내장 LED 등 `builtinLedActiveLow = true`인 보드는 `LOW`가 켜짐
- **ADC 해상도**: AVR(Uno/Nano/Mega)는 10비트(0~1023), ESP32 계열은 12비트(0~4095)
- **비동기 실행**: `setup()`과 `loop()`는 `async function`으로 변환됨. `await _delay()`로 논블로킹
- **전역 충돌**: 라이브러리 전역을 추가할 때 기존 JS 전역(`String`, `Array` 등)을 덮어쓰지 않도록 주의

---

## Git 커밋 규칙

**작업마다 즉시 커밋합니다.**

```
형식: <타입>(<범위>): <설명>
타입: feat / fix / refactor / docs / chore
범위: simulator / transpiler / component / library / circuit / ui / board

예시:
  feat(library): DHT/OneWire/DallasTemperature 라이브러리 추가
  fix(transpiler): C++ 클래스 생성자 선언 변환 버그 수정
  refactor(component): components.js를 카테고리별 파일로 분리
```
