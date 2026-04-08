import { circuitStore, type PlacedComponent, type PlacedWire } from './circuit-store.js';
import { getSpec } from '../../../elements/src/specs/component-specs.js';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  id: string;
  severity: ValidationSeverity;
  compId?: string;
  wireId?: string;
  message: string;
  detail?: string;
}

/**
 * 회로 유효성 검사기
 * 일반적인 회로 오류와 경고를 탐지합니다.
 */
export class CircuitValidator {
  validate(): ValidationResult[] {
    const results: ValidationResult[] = [];
    const comps = circuitStore.components;
    const wires = circuitStore.wires;

    // 보드 존재 여부
    const board = comps.find(c => c.type.startsWith('board'));
    if (!board) {
      results.push({
        id: 'no-board',
        severity: 'error',
        message: '보드가 없습니다',
        detail: '회로에 Arduino Uno 또는 ESP32-C3 보드를 추가하세요',
      });
    }

    for (const comp of comps) {
      if (comp.type.startsWith('board')) continue;
      results.push(...this._validateComponent(comp, wires, board));
    }

    return results;
  }

  private _validateComponent(
    comp: PlacedComponent,
    wires: PlacedWire[],
    board: PlacedComponent | undefined,
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const spec = getSpec(comp.type);
    if (!spec) return results;

    // 컴포넌트에 연결된 와이어 수집
    const connectedWires = wires.filter(
      w => w.fromCompId === comp.id || w.toCompId === comp.id
    );

    // 연결된 핀 목록
    const connectedPins = new Set(connectedWires.map(w =>
      w.fromCompId === comp.id ? w.fromPin : w.toPin
    ));

    // LED: 직렬 저항 체크
    if (comp.type === 'led') {
      const hasResistorInPath = this._hasResistorBetween(comp, wires);
      if (!hasResistorInPath) {
        results.push({
          id: `led-no-resistor-${comp.id}`,
          severity: 'error',
          compId: comp.id,
          message: 'LED에 직렬 저항 없음',
          detail: 'LED ANODE와 GPIO 핀 사이에 저항을 연결하세요 (권장: 220~330Ω)',
        });
      }
    }

    // RGB LED: 각 채널에 저항 체크
    if (comp.type === 'rgb-led') {
      const channelPins = ['RED', 'GREEN', 'BLUE'];
      for (const pin of channelPins) {
        if (!connectedPins.has(pin)) continue;
        const pinWires = connectedWires.filter(
          w => (w.fromCompId === comp.id && w.fromPin === pin) ||
               (w.toCompId === comp.id && w.toPin === pin)
        );
        const otherCompId = pinWires[0]
          ? (pinWires[0].fromCompId === comp.id ? pinWires[0].toCompId : pinWires[0].fromCompId)
          : null;
        const otherComp = otherCompId
          ? circuitStore.components.find(c => c.id === otherCompId)
          : null;
        if (otherComp?.type !== 'resistor') {
          results.push({
            id: `rgb-no-resistor-${comp.id}-${pin}`,
            severity: 'warning',
            compId: comp.id,
            message: `RGB LED ${pin} 채널에 저항 없음`,
            detail: `${pin} 핀과 GPIO 사이에 저항을 추가하세요 (권장: 150~330Ω)`,
          });
        }
      }
    }

    // 서보: VCC가 5V 핀에 연결되지 않으면 경고
    if (comp.type === 'servo' && board) {
      const vccWires = connectedWires.filter(
        w => (w.fromCompId === comp.id && w.fromPin === 'VCC') ||
             (w.toCompId   === comp.id && w.toPin   === 'VCC')
      );
      if (vccWires.length === 0) {
        results.push({
          id: `servo-no-vcc-${comp.id}`,
          severity: 'warning',
          compId: comp.id,
          message: '서보 VCC 연결 없음',
          detail: 'SG90 서보는 4.8~6V 외부 전원 권장. GPIO 5V 핀 또는 외부 전원에 연결하세요',
        });
      }
    }

    // HC-SR04: 3.3V MCU에 ECHO 직접 연결 경고
    if (comp.type === 'ultrasonic' && board?.type === 'board-esp32c3') {
      const echoWires = connectedWires.filter(
        w => (w.fromCompId === comp.id && w.fromPin === 'ECHO') ||
             (w.toCompId   === comp.id && w.toPin   === 'ECHO')
      );
      if (echoWires.length > 0) {
        results.push({
          id: `ultrasonic-echo-voltage-${comp.id}`,
          severity: 'warning',
          compId: comp.id,
          message: 'HC-SR04 ECHO는 5V 출력',
          detail: 'ESP32-C3는 3.3V 입력만 허용. ECHO 핀에 전압 분배 회로 필요 (1kΩ + 2kΩ)',
        });
      }
    }

    // 전원 연결 없는 컴포넌트 경고 (LED/버튼 제외)
    const needsPower = ['servo', 'buzzer', 'lcd', 'oled', 'dht', 'ultrasonic', 'neopixel'];
    if (needsPower.includes(comp.type)) {
      const hasVcc = connectedPins.has('VCC');
      const hasGnd = connectedPins.has('GND');
      if (!hasVcc || !hasGnd) {
        results.push({
          id: `no-power-${comp.id}`,
          severity: 'warning',
          compId: comp.id,
          message: `${spec.name} 전원 연결 없음`,
          detail: `VCC와 GND를 연결해 주세요`,
        });
      }
    }

    // NeoPixel: 픽셀 수 × 60mA 경고
    if (comp.type === 'neopixel') {
      const count = (comp.props.count as number) ?? 8;
      const totalMa = count * 60;
      if (totalMa > 500) {
        results.push({
          id: `neopixel-current-${comp.id}`,
          severity: 'warning',
          compId: comp.id,
          message: `NeoPixel 전류 과다 위험`,
          detail: `${count}개 × 60mA = ${totalMa}mA. USB 전원 한계(500mA) 초과 가능. 외부 5V 전원 사용하세요.`,
        });
      }
    }

    return results;
  }

  /** LED → 저항 → GPIO 경로 체크 */
  private _hasResistorBetween(led: PlacedComponent, wires: PlacedWire[]): boolean {
    // LED ANODE에 연결된 컴포넌트 확인
    const anodeWires = wires.filter(
      w => (w.fromCompId === led.id && w.fromPin === 'ANODE') ||
           (w.toCompId   === led.id && w.toPin   === 'ANODE')
    );
    for (const wire of anodeWires) {
      const otherId = wire.fromCompId === led.id ? wire.toCompId : wire.fromCompId;
      const other = circuitStore.components.find(c => c.id === otherId);
      if (other?.type === 'resistor') return true;
    }
    return false;
  }
}

export const circuitValidator = new CircuitValidator();
