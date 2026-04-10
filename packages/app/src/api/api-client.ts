/**
 * 공통 API 클라이언트
 * API_BASE URL의 단일 소스 — 모든 fetch 요청은 이 모듈을 통해 수행합니다.
 */

const API_BASE = '/api';

/** API 요청 실패 시 던지는 오류 (HTTP 상태 코드 포함) */
export interface ApiError extends Error {
  status: number;
}

/** 공통 fetch 래퍼 — 응답이 ok가 아닐 때 ApiError를 throw */
async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) {
    const err = new Error(`API ${path} failed: ${r.status}`) as ApiError;
    (err as ApiError).status = r.status;
    throw err;
  }
  return r.json() as Promise<T>;
}

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export interface BoardInfo {
  id: string;
  name: string;
  vendor: string;
  mcu: string;
}

export interface CompSummary {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  _builtIn: boolean;
}

/** 서버 GET /api/components/:id 응답 형태 */
export interface CompDef {
  id: string;
  name: string;
  category?: string;
  description?: string;
  icon: string;
  element?: string;
  svgTemplate?: string;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  props: Array<{
    key: string;
    label: string;
    type: string;
    default: unknown;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }>;
  pins: Array<{
    name: string;
    x: number;
    y: number;
    type: string;
    label?: string;
    description?: string;
    required?: boolean;
  }>;
  electrical: {
    vccMin?: number;
    vccMax?: number;
    currentMa?: number;
    maxCurrentMa?: number;
    pinMaxCurrentMa?: number;
    forwardVoltage?: Record<string, number>;
    logic?: string;
  };
  validation: Array<{ rule: string; message: string; severity: 'error' | 'warning'; pin?: string }>;
  notes: string[];
  _builtIn?: boolean;
}

export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  boardId: string;
  description: string;
}

export interface TemplateDetail extends TemplateInfo {
  components: object[];
  code: string;
  wires?: object[];
}

export interface ConnectionValidation {
  valid: boolean;
  message?: string;
}

// ─── API 함수 ─────────────────────────────────────────────────────────────────

/** 지원 보드 목록 조회 */
export async function fetchBoards(): Promise<BoardInfo[]> {
  return apiFetch<BoardInfo[]>('/boards');
}

/** 부품 목록 조회 */
export async function fetchComponents(): Promise<CompSummary[]> {
  const data = await apiFetch<{ components: CompSummary[] }>('/components');
  return data.components;
}

/** 단일 부품 정의 조회 — 없거나 실패 시 null 반환 */
export async function fetchComponentDef(id: string): Promise<CompDef | null> {
  try {
    return await apiFetch<CompDef>(`/components/${id}`);
  } catch {
    return null;
  }
}

/** 템플릿 목록 조회 (카테고리/보드 필터링 가능) */
export async function fetchTemplates(params?: {
  category?: string;
  boardId?: string;
}): Promise<TemplateInfo[]> {
  let path = '/templates';
  if (params) {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.boardId)  qs.set('boardId',  params.boardId);
    const str = qs.toString();
    if (str) path += `?${str}`;
  }
  return apiFetch<TemplateInfo[]>(path);
}

/** 단일 템플릿 상세 조회 */
export async function fetchTemplateDetail(id: string): Promise<TemplateDetail> {
  return apiFetch<TemplateDetail>(`/templates/${id}`);
}

/** 핀 연결 유효성 검사 */
export async function validateConnection(
  fromType: string,
  toType: string,
): Promise<ConnectionValidation> {
  return apiFetch<ConnectionValidation>(`/validate-connection?from=${fromType}&to=${toType}`);
}
