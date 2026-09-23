import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateFlashcards } from './generate.js';
import { saveSet, listSets, getSet, deleteSet } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.post('/api/generate', async (req, res) => {
  const { notes, count = 8 } = req.body ?? {};
  if (!notes || typeof notes !== 'string' || !notes.trim()) {
    return res.status(400).json({ error: 'Paste some notes first.' });
  }

  const clampedCount = Math.min(Math.max(Number(count) || 8, 1), 20);
  const result = await generateFlashcards(notes, clampedCount);
  res.json(result);
});

app.get('/api/sets', (req, res) => {
  res.json(listSets());
});

app.post('/api/sets', (req, res) => {
  const { title, mode, cards } = req.body ?? {};
  if (!title || !Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: 'A title and at least one card are required.' });
  }
  res.status(201).json(saveSet(title, mode || 'demo', cards));
});

app.get('/api/sets/:id', (req, res) => {
  const set = getSet(Number(req.params.id));
  if (!set) return res.status(404).json({ error: 'Set not found.' });
  res.json(set);
});

app.delete('/api/sets/:id', (req, res) => {
  deleteSet(Number(req.params.id));
  res.status(204).end();
});

const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`FlashForge AI listening on http://localhost:${port}`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? 'AI mode enabled (ANTHROPIC_API_KEY found).'
      : 'Demo mode: set ANTHROPIC_API_KEY to enable real AI-generated flashcards.'
  );
});
