const STOPWORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'have', 'which', 'their',
  'about', 'into', 'when', 'where', 'there', 'these', 'those', 'because',
  'also', 'than', 'then', 'while', 'such', 'some', 'more', 'most', 'other',
  'being', 'were', 'been', 'each', 'will', 'would', 'could', 'should',
]);

function splitIntoLines(notes) {
  return notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function longestKeyword(sentence) {
  const words = sentence.match(/[A-Za-z][A-Za-z'-]{3,}/g) || [];
  return words
    .filter((w) => !STOPWORDS.has(w.toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];
}

/** Heuristic fallback: turns "Term: definition" lines into Q&A, and masks a
 *  keyword in plain sentences to make a cloze-style card. No AI required. */
export function generateHeuristicFlashcards(notes, count) {
  const lines = splitIntoLines(notes);
  const cards = [];

  for (const line of lines) {
    if (cards.length >= count) break;

    const splitMatch = line.match(/^(.{2,80}?)\s*[:–-]\s+(.{2,})$/);
    if (splitMatch) {
      cards.push({ question: `What is ${splitMatch[1]}?`, answer: splitMatch[2] });
      continue;
    }

    const keyword = longestKeyword(line);
    if (keyword) {
      const masked = line.replace(new RegExp(`\\b${keyword}\\b`), '_____');
      cards.push({ question: masked, answer: keyword });
    }
  }

  return cards.slice(0, count);
}

/** Real AI mode: asks Claude to turn notes into flashcards. Requires
 *  ANTHROPIC_API_KEY. Falls back to the heuristic generator on any error. */
export async function generateAiFlashcards(notes, count) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are helping a student study. Turn the notes below into exactly ${count} flashcards.
Return ONLY a JSON array like [{"question": "...", "answer": "..."}], no prose, no markdown fences.

Notes:
"""
${notes}
"""`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '[]';
  const jsonText = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1);
  const cards = JSON.parse(jsonText);

  return cards
    .filter((c) => c && c.question && c.answer)
    .slice(0, count);
}

export async function generateFlashcards(notes, count) {
  try {
    const aiCards = await generateAiFlashcards(notes, count);
    if (aiCards && aiCards.length > 0) {
      return { mode: 'ai', cards: aiCards };
    }
  } catch (err) {
    console.error('AI generation failed, falling back to heuristic mode:', err.message);
  }

  return { mode: 'demo', cards: generateHeuristicFlashcards(notes, count) };
}
