/** 핀 연결 정보 */
export interface PinConnection {
  /** 이 컴포넌트의 핀 이름 (예: "ANODE", "VCC", "DATA") */
  pin: string;
  /** 연결된 Arduino 핀 번호 또는 GND/VCC 등 */
  target: number | 'GND' | 'VCC' | '5V' | '3V3';
}

/** 컴포넌트 공통 속성 */
export interface ComponentProps {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  connections?: PinConnection[];
}

/** LED 색상 */
export type LedColor = 'red' | 'green' | 'blue' | 'yellow' | 'white' | 'orange' | 'purple';

/** 시뮬레이션 이벤트 */
export interface SimEvent extends CustomEvent {
  detail: Record<string, unknown>;
}
