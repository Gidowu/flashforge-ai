import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'flashforge.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    mode TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    position INTEGER NOT NULL
  );
`);

export function saveSet(title, mode, cards) {
  const insertSet = db.prepare('INSERT INTO sets (title, mode) VALUES (?, ?)');
  const insertCard = db.prepare(
    'INSERT INTO cards (set_id, question, answer, position) VALUES (?, ?, ?, ?)'
  );

  const run = db.transaction(() => {
    const { lastInsertRowid: setId } = insertSet.run(title, mode);
    cards.forEach((card, i) => insertCard.run(setId, card.question, card.answer, i));
    return setId;
  });

  const setId = run();
  return getSet(setId);
}

export function listSets() {
  return db
    .prepare(
      `SELECT sets.id, sets.title, sets.mode, sets.created_at,
              COUNT(cards.id) AS card_count
       FROM sets
       LEFT JOIN cards ON cards.set_id = sets.id
       GROUP BY sets.id
       ORDER BY sets.created_at DESC`
    )
    .all();
}

export function getSet(id) {
  const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(id);
  if (!set) return null;
  const cards = db
    .prepare('SELECT question, answer FROM cards WHERE set_id = ? ORDER BY position')
    .all(id);
  return { ...set, cards };
}

export function deleteSet(id) {
  db.prepare('DELETE FROM sets WHERE id = ?').run(id);
}
