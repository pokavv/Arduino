import { circuitStore, type PlacedComponent, type PlacedWire } from './circuit-store.js';
import { fetchCompDef, getCachedCompDef, type CompDef } from './comp-def-cache.js';

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
 *
 * - validate()      : 동기 검사 (로컬 규칙 + 캐시된 서버 def 활용)
 * - validateAsync() : 서버 def 비동기 로드 후 재검사 (더 정밀)
 */
export class CircuitValidator {
  // ─── 서버 def 패치 (공유 캐시 위임) ──────────────────────────────

  /** 회로에 있는 모든 컴포넌트 def를 미리 캐시 */
  async prefetchAll(): Promise<void> {
    const types = [...new Set(circuitStore.components.map(c => c.type))];
    await Promise.all(types.map(t => fetchCompDef(t)));
  }

  // ─── 검사 진입점 ─────────────────────────────────────────────────

  /** 동기 검사 (캐시된 서버 def + 내장 규칙) */
  validate(): ValidationResult[] {
    const results: ValidationResult[] = [];
    const comps = circuitStore.components;
    const wires = circuitStore.wires;

    // 보드 존재 여부
    const board = comps.find(c => c.type.startsWith('board'));
    if (!board) {
      results.push({
        id: 'no-board', severity: 'error',
        message: '보드가 없습니다',
        detail: '회로에 Arduino Uno 또는 ESP32-C3 보드를 추가하세요',
      });
    }

    for (const comp of comps) {
      if (comp.type.startsWith('board')) continue;
      results.push(...this._checkComponent(comp, wires, board));
    }

    return results;
  }

  /** 비동기 검사: 서버 def 로드 후 재검사 → 캐시 갱신 → 동기 검사 결과 반환 */
  async validateAsync(): Promise<ValidationResult[]> {
    await this.prefetchAll();
    const results = this.validate();

    // 전원 필요 컴포넌트 검사 — 서버 def의 electrical.currentMa 기반
    const comps = circuitStore.components;
    const wires = circuitStore.wires;
    for (const comp of comps) {
      if (comp.type.startsWith('board')) continue;
      const def = await fetchCompDef(comp.type);
      if (def && (def.electrical?.currentMa ?? 0) > 5) {
        const connectedPins = new Set(
          wires
            .filter(w => w.fromCompId === comp.id || w.toCompId === comp.id)
            .map(w => (w.fromCompId === comp.id ? w.fromPin : w.toPin))
        );
        const hasVcc = connectedPins.has('VCC');
        const hasGnd = connectedPins.has('GND');
        if (!hasVcc || !hasGnd) {
          const alreadyReported = results.some(r => r.id === `no-power-${comp.id}`);
          if (!alreadyReported) {
            results.push({
              id:       `no-power-${comp.id}`,
              severity: 'warning',
              compId:   comp.id,
              message:  `${def.name}: 전원 연결 없음`,
              detail:   'VCC와 GND를 모두 연결해 주세요',
            });
          }
        }
      }
    }

    return results;
  }

  // ─── 컴포넌트별 검사 ─────────────────────────────────────────────

  private _checkComponent(
    comp: PlacedComponent,
    wires: PlacedWire[],
    board: PlacedComponent | undefined,
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const connectedWires = wires.filter(w => w.fromCompId === comp.id || w.toCompId === comp.id);
    const connectedPins  = new Set(connectedWires.map(w =>
      w.fromCompId === comp.id ? w.fromPin : w.toPin
    ));

    // ── 서버 def 기반 규칙 적용 (캐시 있을 때만) ──────────────────
    const def = getCachedCompDef(comp.type);
    if (def) {
      results.push(...this._checkServerValidation(comp, def, connectedPins, connectedWires, board));
    }

    // ── 내장 규칙 (빌트인 컴포넌트 전용) ─────────────────────────
    results.push(...this._checkBuiltinRules(comp, connectedPins, connectedWires, board, def?.name));

    return results;
  }

  /** 서버 def의 validation 배열 기반 규칙 적용 */
  private _checkServerValidation(
    comp: PlacedComponent,
    def: CompDef,
    connectedPins: Set<string>,
    _wires: PlacedWire[],
    board: PlacedComponent | undefined,
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const rule of def.validation) {
      switch (rule.rule) {
        // 필수 핀 연결 확인
        case 'pin_required': {
          const pin = rule.pin;
          if (pin && !connectedPins.has(pin)) {
            results.push({
              id:       `server-${rule.rule}-${comp.id}-${pin}`,
              severity: rule.severity,
              compId:   comp.id,
              message:  rule.message,
            });
          }
          break;
        }
        // 전압 레벨 불일치 경고
        case 'voltage_mismatch': {
          if (def.electrical.logic === '5V' && board?.type === 'board-esp32c3') {
            results.push({
              id:       `voltage-${comp.id}`,
              severity: 'warning',
              compId:   comp.id,
              message:  rule.message || `${def.name}: 5V 전용 부품 — ESP32-C3(3.3V) 직접 연결 주의`,
            });
          }
          break;
        }
      }
    }

    // required 핀 연결 확인 (validation 배열 없어도)
    for (const pin of def.pins) {
      if (pin.required && !connectedPins.has(pin.name)) {
        const exists = results.some(r => r.id.includes(`pin_required-${comp.id}-${pin.name}`));
        if (!exists) {
          results.push({
            id:       `required-pin-${comp.id}-${pin.name}`,
            severity: 'warning',
            compId:   comp.id,
            message:  `${def.name}: 필수 핀 '${pin.name}' 미연결`,
            detail:   pin.description,
          });
        }
      }
    }

    return results;
  }

  /** 내장 컴포넌트 전용 상세 규칙 */
  private _checkBuiltinRules(
    comp: PlacedComponent,
    connectedPins: Set<string>,
    connectedWires: PlacedWire[],
    board: PlacedComponent | undefined,
    compName?: string,
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // LED: 직렬 저항 필수
    if (comp.type === 'led') {
      if (!this._hasResistorBetween(comp, connectedWires)) {
        results.push({
          id:       `led-no-resistor-${comp.id}`,
          severity: 'error',
          compId:   comp.id,
          message:  'LED에 직렬 저항 없음',
          detail:   'LED ANODE와 GPIO 핀 사이에 저항을 연결하세요 (권장: 220~330Ω)',
        });
      }
    }

    // RGB LED: 각 채널 저항 확인
    if (comp.type === 'rgb-led') {
      for (const pin of ['RED', 'GREEN', 'BLUE']) {
        if (!connectedPins.has(pin)) continue;
        const pinWires = connectedWires.filter(
          w => (w.fromCompId === comp.id && w.fromPin === pin) ||
               (w.toCompId   === comp.id && w.toPin   === pin)
        );
        const otherId  = pinWires[0]
          ? (pinWires[0].fromCompId === comp.id ? pinWires[0].toCompId : pinWires[0].fromCompId)
          : null;
        const other = otherId ? circuitStore.components.find(c => c.id === otherId) : null;
        if (other?.type !== 'resistor') {
          results.push({
            id:       `rgb-no-resistor-${comp.id}-${pin}`,
            severity: 'warning',
            compId:   comp.id,
            message:  `RGB LED ${pin} 채널에 저항 없음`,
            detail:   `${pin} 핀과 GPIO 사이에 저항을 추가하세요 (권장: 150~330Ω)`,
          });
        }
      }
    }

    // 서보: VCC 연결 확인
    if (comp.type === 'servo' && board) {
      const hasVcc = connectedWires.some(
        w => (w.fromCompId === comp.id && w.fromPin === 'VCC') ||
             (w.toCompId   === comp.id && w.toPin   === 'VCC')
      );
      if (!hasVcc) {
        results.push({
          id: `servo-no-vcc-${comp.id}`, severity: 'warning', compId: comp.id,
          message: '서보 VCC 연결 없음',
          detail: 'SG90 서보는 4.8~6V 필요. GPIO 5V 핀 또는 외부 전원에 연결하세요',
        });
      }
    }

    // HC-SR04: ESP32-C3의 3.3V에 5V ECHO 연결 경고
    if (comp.type === 'ultrasonic' && board?.type === 'board-esp32c3') {
      const echoConnected = connectedWires.some(
        w => (w.fromCompId === comp.id && w.fromPin === 'ECHO') ||
             (w.toCompId   === comp.id && w.toPin   === 'ECHO')
      );
      if (echoConnected) {
        results.push({
          id: `ultrasonic-echo-voltage-${comp.id}`, severity: 'warning', compId: comp.id,
          message: 'HC-SR04 ECHO는 5V 출력',
          detail: 'ESP32-C3는 3.3V 입력만 허용. ECHO에 전압 분배 회로 필요 (1kΩ + 2kΩ)',
        });
      }
    }

    // NeoPixel: 픽셀 수 × 60mA 과전류 경고
    if (comp.type === 'neopixel') {
      const count    = (comp.props.count as number) ?? 8;
      const totalMa  = count * 60;
      if (totalMa > 500) {
        results.push({
          id:       `neopixel-current-${comp.id}`,
          severity: 'warning',
          compId:   comp.id,
          message:  'NeoPixel 전류 과다 위험',
          detail:   `${count}개 × 60mA = ${totalMa}mA. USB 한계(500mA) 초과. 외부 5V 전원 사용하세요.`,
        });
      }
    }

    return results;
  }

  // ─── 보조 함수 ────────────────────────────────────────────────────

  /** LED ANODE — 저항 — GPIO 경로 확인 */
  private _hasResistorBetween(led: PlacedComponent, wires: PlacedWire[]): boolean {
    const anodeWires = wires.filter(
      w => (w.fromCompId === led.id && w.fromPin === 'ANODE') ||
           (w.toCompId   === led.id && w.toPin   === 'ANODE')
    );
    for (const wire of anodeWires) {
      const otherId = wire.fromCompId === led.id ? wire.toCompId : wire.fromCompId;
      const other   = circuitStore.components.find(c => c.id === otherId);
      if (other?.type === 'resistor') return true;
    }
    return false;
  }
}

export const circuitValidator = new CircuitValidator();
