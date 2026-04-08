import { Router } from 'express';
import { BOARDS } from '../data/boards.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(BOARDS.map(b => ({
    id: b.id, name: b.name, vendor: b.vendor,
    mcu: b.mcu, freq: b.freq, voltage: b.voltage,
    element: b.element,
  })));
});

router.get('/:id', (req, res) => {
  const board = BOARDS.find(b => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

export default router;
