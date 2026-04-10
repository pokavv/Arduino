/**
 * 컴포넌트 타입별 입력 핀 핸들러 레지스트리
 * 새 센서/입력 부품 추가 시 이 파일에만 항목 추가하면 됩니다.
 */

export interface InputPinHandler {
  /** 컴포넌트의 핀 이름 (connections 맵의 키) */
  pin: string;
  /** _ctx에 저장할 키 접두사 (뒤에 `_${comp.id}` 붙음) */
  ctxKey: string;
  /** 초기/기본값 */
  defaultValue: number;
}

/**
 * 컴포넌트 타입 → 입력 핀 핸들러 목록
 * SENSOR_UPDATE에서도 동일한 ctxKey를 사용해야 합니다.
 */
export const INPUT_PIN_REGISTRY: Record<string, InputPinHandler[]> = {
  // INPUT_PULLUP 기준: 기본값 HIGH(1) = 안 눌림
  'button':        [{ pin: 'PIN1A',  ctxKey: '__btn',    defaultValue: 1 }],
  'potentiometer': [{ pin: 'WIPER',  ctxKey: '__pot',    defaultValue: 512 }],
  'hall-sensor':   [{ pin: 'OUT',    ctxKey: '__sensor', defaultValue: 0 }],
  'pir-sensor':    [{ pin: 'OUT',    ctxKey: '__sensor', defaultValue: 0 }],
  'sound-sensor':  [{ pin: 'DO',     ctxKey: '__sensor', defaultValue: 0 }],
  'ir-receiver':   [{ pin: 'OUT',    ctxKey: '__sensor', defaultValue: 0 }],
  'joystick':      [
    { pin: 'VRX',  ctxKey: '__joyX',  defaultValue: 512 },
    { pin: 'VRY',  ctxKey: '__joyY',  defaultValue: 512 },
    { pin: 'SW',   ctxKey: '__joySW', defaultValue: 1 },
  ],
};
