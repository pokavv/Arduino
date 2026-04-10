/**
 * 서버 ComponentDef 공유 캐시
 * circuit-canvas.ts와 property-panel.ts 등 여러 곳에서 재사용
 */

import { fetchComponentDef } from '../api/api-client.js';
// CompDef를 이 모듈에서 re-export — 기존 import 경로 유지
export type { CompDef } from '../api/api-client.js';
import type { CompDef } from '../api/api-client.js';

const _cache = new Map<string, CompDef | null>();

/** 서버에서 CompDef를 가져와 캐시. 없거나 실패하면 null */
export async function fetchCompDef(type: string): Promise<CompDef | null> {
  if (_cache.has(type)) return _cache.get(type) ?? null;
  const def = await fetchComponentDef(type);
  _cache.set(type, def);
  return def;
}

/** 이미 캐시된 값 동기 조회 (없으면 undefined) */
export function getCachedCompDef(type: string): CompDef | null | undefined {
  return _cache.get(type);
}

/** 캐시 전체 클리어 (서버 데이터 변경 후 새로고침 용도) */
export function clearCompDefCache(): void {
  _cache.clear();
}
