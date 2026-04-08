import { Router } from 'express';
import { COMPONENTS, getComponentDef } from '../data/components.js';
import { WIRE_TYPES, resolveWireType } from '../data/wires.js';
import { checkConnection } from '../data/connections.js';

const router = Router();

// GET /api/components — 전체 컴포넌트 목록 (요약)
router.get('/', (req, res) => {
  const { category, tag } = req.query as Record<string, string>;

  let result = COMPONENTS;

  if (category) {
    result = result.filter(c => c.category === category);
  }
  if (tag) {
    result = result.filter(c => c.tags.includes(tag));
  }

  // 목록에서는 무거운 pins/validation 제외하고 핵심만 반환
  const summary = result.map(c => ({
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
  }));

  res.json({ components: summary, total: summary.length });
});

// GET /api/components/categories — 카테고리 목록
router.get('/categories', (_req, res) => {
  const cats = [...new Set(COMPONENTS.map(c => c.category))];
  res.json({ categories: cats });
});

// GET /api/components/:id — 컴포넌트 전체 정의
router.get('/:id', (req, res) => {
  const def = getComponentDef(req.params.id);
  if (!def) {
    res.status(404).json({ error: `컴포넌트 '${req.params.id}' 를 찾을 수 없습니다` });
    return;
  }
  res.json(def);
});

// GET /api/wires — 전체 전선 타입 목록
router.get('/wires/list', (_req, res) => {
  res.json({ wires: WIRE_TYPES });
});

// GET /api/wires/auto?pin=ANODE&pinType=input — 자동 전선 타입 결정
router.get('/wires/auto', (req, res) => {
  const { pin, pinType } = req.query as Record<string, string>;
  if (!pin) {
    res.status(400).json({ error: 'pin 파라미터 필요' });
    return;
  }
  const wire = resolveWireType(pin, pinType);
  res.json(wire);
});

// GET /api/connections/validate?from=digital&to=ground — 연결 유효성 검사
router.get('/connections/validate', (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  if (!from || !to) {
    res.status(400).json({ error: 'from, to 파라미터 필요' });
    return;
  }
  const result = checkConnection(from, to);
  res.json(result);
});

export default router;
