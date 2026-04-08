import { Router, Request, Response } from 'express';
import { componentStore } from '../store/component-store.js';
import { WIRE_TYPES, resolveWireType } from '../data/wires.js';
import { checkConnection } from '../data/connections.js';

const router = Router();

// ─── 컴포넌트 CRUD ────────────────────────────────────────────────────────

/**
 * GET /api/components
 * 전체 컴포넌트 목록 (요약)
 * query: category, tag
 */
router.get('/', (req: Request, res: Response) => {
  const { category, tag } = req.query as Record<string, string>;
  const all = componentStore.findAll({ category, tag });

  const summary = all.map(c => ({
    id:          c.id,
    name:        c.name,
    category:    c.category,
    tags:        c.tags,
    description: c.description,
    element:     c.element,
    width:       c.width,
    height:      c.height,
    defaultProps: c.defaultProps,
    pinCount:    c.pins.length,
    propCount:   c.props.length,
    _builtIn:    c._builtIn,
    _updatedAt:  c._updatedAt,
  }));

  res.json({ components: summary, total: summary.length });
});

/**
 * GET /api/components/categories
 * 카테고리 목록
 */
router.get('/categories', (_req: Request, res: Response) => {
  res.json({ categories: componentStore.categories() });
});

/**
 * POST /api/components
 * 새 부품 등록
 * body: ComponentDef (id, name, category, ... 모두 포함)
 */
router.post('/', (req: Request, res: Response) => {
  const data = req.body;

  // 필수 필드 검증
  const required = ['id', 'name', 'category', 'description', 'width', 'height'];
  for (const f of required) {
    if (!data[f]) {
      res.status(400).json({ error: `필수 필드 누락: '${f}'` });
      return;
    }
  }
  // id 형식 검증 (소문자, 하이픈 허용)
  if (!/^[a-z0-9-]+$/.test(data.id)) {
    res.status(400).json({ error: 'id는 소문자, 숫자, 하이픈만 허용됩니다' });
    return;
  }

  try {
    const created = componentStore.create({
      id:           data.id,
      name:         data.name,
      category:     data.category,
      tags:         Array.isArray(data.tags) ? data.tags : [],
      description:  data.description,
      element:      data.element,
      svgTemplate:  data.svgTemplate,
      width:        Number(data.width)  || 60,
      height:       Number(data.height) || 60,
      defaultProps: data.defaultProps ?? {},
      props:        data.props  ?? [],
      pins:         data.pins   ?? [],
      electrical:   data.electrical ?? {},
      validation:   data.validation ?? [],
      notes:        data.notes ?? [],
      datasheet:    data.datasheet,
    });
    res.status(201).json(created);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(409).json({ error: msg });
  }
});

/**
 * GET /api/components/:id
 * 단건 전체 정의 조회
 */
router.get('/:id', (req: Request, res: Response) => {
  // 특수 경로는 별도 라우터로 처리하므로 여기선 제외
  if (['wires', 'connections'].includes(req.params.id)) {
    res.status(404).json({ error: '경로를 확인하세요' });
    return;
  }
  const def = componentStore.findById(req.params.id);
  if (!def) {
    res.status(404).json({ error: `부품 없음: '${req.params.id}'` });
    return;
  }
  res.json(def);
});

/**
 * PUT /api/components/:id
 * 부품 전체 교체 (기본 제공 부품도 수정 가능)
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = componentStore.replace(req.params.id, req.body);
    res.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(404).json({ error: msg });
  }
});

/**
 * PATCH /api/components/:id
 * 부품 부분 수정
 */
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const updated = componentStore.replace(req.params.id, req.body);
    res.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(404).json({ error: msg });
  }
});

/**
 * DELETE /api/components/:id
 * 부품 삭제 (기본 제공 부품 삭제 불가)
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    componentStore.delete(req.params.id);
    res.json({ ok: true, id: req.params.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg.includes('기본 제공') ? 403 : 404;
    res.status(status).json({ error: msg });
  }
});

// ─── 전선 타입 ────────────────────────────────────────────────────────────

/**
 * GET /api/components/wires/list
 */
router.get('/wires/list', (_req: Request, res: Response) => {
  res.json({ wires: WIRE_TYPES });
});

/**
 * GET /api/components/wires/auto?pin=ANODE&pinType=input
 */
router.get('/wires/auto', (req: Request, res: Response) => {
  const { pin, pinType } = req.query as Record<string, string>;
  if (!pin) {
    res.status(400).json({ error: 'pin 파라미터 필요' });
    return;
  }
  res.json(resolveWireType(pin, pinType));
});

// ─── 연결 유효성 ──────────────────────────────────────────────────────────

/**
 * GET /api/components/connections/validate?from=digital&to=ground
 */
router.get('/connections/validate', (req: Request, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  if (!from || !to) {
    res.status(400).json({ error: 'from, to 파라미터 필요' });
    return;
  }
  res.json(checkConnection(from, to));
});

export default router;
