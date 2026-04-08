import { Router } from 'express';
import { TEMPLATES } from '../data/templates.js';

const router = Router();

router.get('/', (req, res) => {
  const { category, boardId } = req.query;
  let list = TEMPLATES;
  if (category) list = list.filter(t => t.category === category);
  if (boardId) list = list.filter(t => t.boardId === boardId);
  res.json(list.map(t => ({
    id: t.id, name: t.name, category: t.category,
    boardId: t.boardId, description: t.description,
  })));
});

router.get('/:id', (req, res) => {
  const tpl = TEMPLATES.find(t => t.id === req.params.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  res.json(tpl);
});

export default router;
