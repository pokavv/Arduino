import express from 'express';
import cors from 'cors';
import boardsRouter from './routes/boards.js';
import templatesRouter from './routes/templates.js';
import componentsRouter from './routes/components.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: /^http:\/\/localhost(:\d+)?$/,
  optionsSuccessStatus: 200,
}));
app.use(express.json());

// API 라우트
app.use('/api/boards',     boardsRouter);
app.use('/api/templates',  templatesRouter);
app.use('/api/components', componentsRouter);

// 헬스 체크
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.2.0' });
});

app.listen(PORT, () => {
  console.log(`\n🔌 Arduino Web Simulator API`);
  console.log(`   http://localhost:${PORT}/api/health\n`);
});

export default app;
