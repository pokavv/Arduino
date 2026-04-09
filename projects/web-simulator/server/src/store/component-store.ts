/**
 * 컴포넌트 정의 영속 저장소
 * server/data/components.json 에 읽기/쓰기
 * 파일이 없으면 초기 시드 데이터로 생성
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_COMPONENTS } from '../data/components.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = resolve(__dirname, '../../data');
const COMP_FILE = resolve(DATA_DIR, 'components.json');

export type PropType = 'string' | 'number' | 'boolean' | 'select' | 'color';
export type PinType  =
  | 'power' | 'ground' | 'digital' | 'analog' | 'pwm'
  | 'i2c_sda' | 'i2c_scl' | 'spi_mosi' | 'spi_miso' | 'spi_sck' | 'spi_ss'
  | 'uart_tx' | 'uart_rx' | 'signal' | 'output' | 'input';

export interface PropDef {
  key: string;
  label: string;
  type: PropType;
  default: unknown;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface PinDef {
  name: string;
  label: string;
  description: string;
  type: PinType;
  required: boolean;
  compatibleWith: string[];
  /** 컴포넌트 SVG 내 핀 위치 (px) */
  x: number;
  y: number;
}

export interface ValidationEntry {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  pin?: string;
}

export interface ComponentDef {
  id: string;
  name: string;
  category: 'passive' | 'active' | 'sensor' | 'display' | 'actuator' | 'power' | 'mcu';
  tags: string[];
  description: string;
  /** 팔레트 및 패널에 표시할 이모지 아이콘 */
  icon: string;
  /** 렌더링에 사용할 Lit custom element 태그 (없으면 svgTemplate 사용) */
  element?: string;
  /** element 없을 때 렌더링할 SVG 마크업 (인라인 SVG 문자열) */
  svgTemplate?: string;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  props: PropDef[];
  pins: PinDef[];
  electrical: {
    vccMin?: number;
    vccMax?: number;
    currentMa?: number;
    maxCurrentMa?: number;
    forwardVoltage?: Record<string, number>;
    resistance?: number;
    logic?: '3.3V' | '5V' | 'both';
    pinMaxCurrentMa?: number;
  };
  validation: ValidationEntry[];
  notes: string[];
  datasheet?: string;
  /** 서버 내부 메타데이터 */
  _createdAt?: string;
  _updatedAt?: string;
  _builtIn?: boolean;   // true = 기본 제공 부품 (삭제 불가)
}

// ─── 저장소 클래스 ─────────────────────────────────────────────────────────

class ComponentStore {
  private _components: Map<string, ComponentDef> = new Map();

  constructor() {
    this._load();
  }

  // ── 내부 IO ───────────────────────────────────────────────────────────────

  private _load() {
    if (!existsSync(COMP_FILE)) {
      // 최초 실행: 시드 데이터로 파일 생성
      mkdirSync(DATA_DIR, { recursive: true });
      const seeded = SEED_COMPONENTS.map(c => ({
        ...c,
        _builtIn: true,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      }));
      this._save(seeded);
      console.log(`[ComponentStore] ${seeded.length}개 기본 부품으로 초기화: ${COMP_FILE}`);
    }

    const raw = readFileSync(COMP_FILE, 'utf-8');
    const arr = JSON.parse(raw) as ComponentDef[];
    this._components.clear();
    for (const c of arr) this._components.set(c.id, c);
    console.log(`[ComponentStore] ${this._components.size}개 부품 로드`);

    // ── _builtIn 부품 마이그레이션 ──────────────────────────────
    // 시드 데이터에 새 필드(svgTemplate, 핀 업데이트 등)가 추가됐을 때
    // 기존 JSON 파일에 반영되지 않은 _builtIn 부품을 자동으로 업데이트한다.
    const seedMap = new Map(SEED_COMPONENTS.map(s => [s.id, s]));
    let migrated = 0;

    for (const [id, stored] of this._components) {
      if (!stored._builtIn) continue;
      const seed = seedMap.get(id);
      if (!seed) continue;

      // svgTemplate, pins, props, electrical, validation, notes 등 시드 기준으로 갱신
      const needsUpdate =
        stored.svgTemplate !== seed.svgTemplate ||
        JSON.stringify(stored.pins) !== JSON.stringify(seed.pins) ||
        JSON.stringify(stored.props) !== JSON.stringify(seed.props);

      if (needsUpdate) {
        const updated: ComponentDef = {
          ...stored,
          svgTemplate:  seed.svgTemplate,
          pins:         seed.pins as ComponentDef['pins'],
          props:        seed.props as ComponentDef['props'],
          electrical:   seed.electrical as ComponentDef['electrical'],
          validation:   seed.validation as ComponentDef['validation'],
          notes:        seed.notes,
          datasheet:    seed.datasheet,
          width:        seed.width,
          height:       seed.height,
          _updatedAt:   new Date().toISOString(),
        };
        this._components.set(id, updated);
        migrated++;
      }
    }

    if (migrated > 0) {
      this._save();
      console.log(`[ComponentStore] _builtIn 부품 ${migrated}개 시드 데이터로 마이그레이션 완료`);
    }
  }

  private _save(list?: ComponentDef[]) {
    const arr = list ?? [...this._components.values()];
    writeFileSync(COMP_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** 전체 목록 반환 */
  findAll(opts?: { category?: string; tag?: string }): ComponentDef[] {
    let arr = [...this._components.values()];
    if (opts?.category) arr = arr.filter(c => c.category === opts.category);
    if (opts?.tag)      arr = arr.filter(c => c.tags.includes(opts.tag!));
    return arr;
  }

  /** ID로 단건 조회 */
  findById(id: string): ComponentDef | undefined {
    return this._components.get(id);
  }

  /** 새 부품 등록 */
  create(data: Omit<ComponentDef, '_createdAt' | '_updatedAt' | '_builtIn'>): ComponentDef {
    if (this._components.has(data.id)) {
      throw new Error(`이미 존재하는 ID: '${data.id}'`);
    }
    const now = new Date().toISOString();
    const comp: ComponentDef = { ...data, _builtIn: false, _createdAt: now, _updatedAt: now };
    this._components.set(comp.id, comp);
    this._save();
    return comp;
  }

  /** 기존 부품 전체 교체 */
  replace(id: string, data: Partial<ComponentDef>): ComponentDef {
    const existing = this._components.get(id);
    if (!existing) throw new Error(`부품 없음: '${id}'`);
    const updated: ComponentDef = {
      ...existing,
      ...data,
      id,  // id 변경 방지
      _builtIn:   existing._builtIn,
      _createdAt: existing._createdAt,
      _updatedAt: new Date().toISOString(),
    };
    this._components.set(id, updated);
    this._save();
    return updated;
  }

  /** 부품 삭제 (기본 제공 부품은 삭제 불가) */
  delete(id: string): void {
    const comp = this._components.get(id);
    if (!comp)           throw new Error(`부품 없음: '${id}'`);
    if (comp._builtIn)   throw new Error(`기본 제공 부품은 삭제할 수 없습니다: '${id}'`);
    this._components.delete(id);
    this._save();
  }

  /** 카테고리 목록 */
  categories(): string[] {
    return [...new Set([...this._components.values()].map(c => c.category))];
  }
}

export const componentStore = new ComponentStore();
