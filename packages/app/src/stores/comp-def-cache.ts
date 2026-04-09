/**
 * 서버 ComponentDef 공유 캐시
 * circuit-canvas.ts와 property-panel.ts 등 여러 곳에서 재사용
 */

const API_BASE = '/api';

/** 서버 GET /api/components/:id 응답 형태 (필요한 필드만) */
export interface CompDef {
  id: string;
  name: string;
  icon: string;
  element?: string;
  svgTemplate?: string;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  props: Array<{ key: string; label: string; type: string; default: unknown; options?: string[]; min?: number; max?: number; unit?: string }>;
  pins: Array<{ name: string; x: number; y: number; type: string; label?: string; description?: string; required?: boolean }>;
  electrical: {
    vccMin?: number;
    vccMax?: number;
    currentMa?: number;
    maxCurrentMa?: number;
    forwardVoltage?: Record<string, number>;
    logic?: string;
  };
  validation: Array<{ rule: string; message: string; severity: 'error' | 'warning'; pin?: string }>;
  notes: string[];
  _builtIn?: boolean;
}

const _cache = new Map<string, CompDef | null>();

/** 서버에서 CompDef를 가져와 캐시. 없거나 실패하면 null */
export async function fetchCompDef(type: string): Promise<CompDef | null> {
  if (_cache.has(type)) return _cache.get(type) ?? null;
  try {
    const r = await fetch(`${API_BASE}/components/${type}`);
    if (!r.ok) { _cache.set(type, null); return null; }
    const def = await r.json() as CompDef;
    _cache.set(type, def);
    return def;
  } catch {
    _cache.set(type, null);
    return null;
  }
}

/** 이미 캐시된 값 동기 조회 (없으면 undefined) */
export function getCachedCompDef(type: string): CompDef | null | undefined {
  return _cache.get(type);
}

/** 캐시 전체 클리어 (서버 데이터 변경 후 새로고침 용도) */
export function clearCompDefCache(): void {
  _cache.clear();
}
