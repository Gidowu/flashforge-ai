import { useEffect, useState } from 'react';
import Flashcard from './components/Flashcard.jsx';

const SAMPLE_NOTES = `Mitochondria: the organelle that produces ATP through cellular respiration.
Photosynthesis: the process plants use to convert light energy into chemical energy.
Osmosis is the movement of water across a membrane from low to high solute concentration.
Ribosomes: the site of protein synthesis inside a cell.`;

export default function App() {
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [count, setCount] = useState(6);
  const [cards, setCards] = useState([]);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSets, setSavedSets] = useState([]);
  const [title, setTitle] = useState('');

  const loadSavedSets = () => {
    fetch('/api/sets')
      .then((r) => r.json())
      .then(setSavedSets)
      .catch(() => {});
  };

  useEffect(loadSavedSets, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setCards(data.cards);
      setMode(data.mode);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || cards.length === 0) return;
    await fetch('/api/sets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, mode, cards }),
    });
    setTitle('');
    loadSavedSets();
  }

  async function handleLoad(id) {
    const res = await fetch(`/api/sets/${id}`);
    const set = await res.json();
    setCards(set.cards);
    setMode(set.mode);
  }

  async function handleDelete(id) {
    await fetch(`/api/sets/${id}`, { method: 'DELETE' });
    loadSavedSets();
  }

  return (
    <div className="app">
      <header className="header">
        <h1>⚡ FlashForge AI</h1>
        <p>Paste your notes. Get flashcards. Study smarter.</p>
      </header>

      <form className="panel" onSubmit={handleGenerate}>
        <label htmlFor="notes">Your notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="Paste lecture notes, a textbook summary, anything you need to study..."
        />
        <div className="row">
          <label htmlFor="count">
            Cards:
            <input
              id="count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Generating…' : 'Generate flashcards'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>

      {cards.length > 0 && (
        <section className="panel">
          <div className="row row--between">
            <span className={`badge badge--${mode}`}>
              {mode === 'ai' ? 'AI-generated' : 'Demo mode (heuristic)'}
            </span>
            <div className="row">
              <input
                placeholder="Name this set to save it"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button onClick={handleSave} type="button">
                Save set
              </button>
            </div>
          </div>
          <div className="grid">
            {cards.map((card, i) => (
              <Flashcard key={i} question={card.question} answer={card.answer} />
            ))}
          </div>
        </section>
      )}

      {savedSets.length > 0 && (
        <section className="panel">
          <h2>Saved sets</h2>
          <ul className="set-list">
            {savedSets.map((set) => (
              <li key={set.id}>
                <button className="link" onClick={() => handleLoad(set.id)}>
                  {set.title}
                </button>
                <span className="muted">
                  {set.card_count} cards · {set.mode}
                </span>
                <button className="link link--danger" onClick={() => handleDelete(set.id)}>
                  delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
