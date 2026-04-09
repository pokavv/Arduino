// 베이스 클래스
export { SimElement } from './components/sim-element.js';

// 수동 소자
export { SimLed } from './components/sim-led.js';
export { SimRgbLed } from './components/sim-rgb-led.js';
export { SimButton } from './components/sim-button.js';
export { SimResistor } from './components/sim-resistor.js';
export { SimCapacitor } from './components/sim-capacitor.js';
export { SimDiode } from './components/sim-diode.js';
export { SimTransistorNpn } from './components/sim-transistor-npn.js';
export { SimBuzzer } from './components/sim-buzzer.js';
export { SimPotentiometer } from './components/sim-potentiometer.js';

// 디스플레이
export { SimSevenSegment } from './components/sim-seven-segment.js';
export { SimLcd } from './components/sim-lcd.js';
export { SimOled } from './components/sim-oled.js';

// 센서
export { SimDht } from './components/sim-dht.js';
export { SimUltrasonic } from './components/sim-ultrasonic.js';
export { SimIrLed } from './components/sim-ir-led.js';
export { SimIrReceiver } from './components/sim-ir-receiver.js';
export { SimHallSensor } from './components/sim-hall-sensor.js';
export { SimLm35 } from './components/sim-lm35.js';
export { SimPirSensor } from './components/sim-pir-sensor.js';
export { SimSoundSensor } from './components/sim-sound-sensor.js';

// 액추에이터
export { SimServo } from './components/sim-servo.js';
export { SimNeopixel } from './components/sim-neopixel.js';
export { SimRelay } from './components/sim-relay.js';
export { SimDcMotor } from './components/sim-dc-motor.js';

// 보드
export { SimBoardUno } from './components/sim-board-uno.js';
export { SimBoardEsp32c3 } from './components/sim-board-esp32c3.js';

// 범용 (서버 정의 커스텀 컴포넌트)
export { SimGeneric } from './components/sim-generic.js';
export type { GenericPinDef } from './components/sim-generic.js';

// 유틸
export { pinMatch } from './utils/pin-match.js';
export type { PinConnection, ComponentProps, LedColor } from './types.js';
