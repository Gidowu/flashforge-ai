import { useState } from 'react';

export default function Flashcard({ question, answer }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      className={`card ${flipped ? 'card--flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
      aria-label="Flip flashcard"
    >
      <div className="card__inner">
        <div className="card__face card__face--front">{question}</div>
        <div className="card__face card__face--back">{answer}</div>
      </div>
    </button>
  );
}
