import { knowledgeBase, fallbackResponse, clarificationResponse } from './knowledgeBase.js';

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text).split(' ').filter((w) => w.length > 1);
}

function scoreEntry(entry, queryTokens) {
  let score = 0;
  const allKeywords = new Set();
  for (const kw of entry.keywords) allKeywords.add(normalize(kw));
  for (const [key, syns] of Object.entries(entry.synonyms)) {
    allKeywords.add(normalize(key));
    for (const s of syns) allKeywords.add(normalize(s));
  }
  for (const token of queryTokens) {
    for (const kw of allKeywords) {
      if (kw === token) score += 3;
      else if (kw.includes(token) || token.includes(kw)) score += 1;
    }
  }
  const questionTokens = tokenize(entry.question);
  for (const token of queryTokens) {
    if (questionTokens.includes(token)) score += 2;
  }
  return score;
}

export function processQuery(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { answer: fallbackResponse, matchedEntries: [] };

  const scored = knowledgeBase
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
    .sort((a, b) => b.score - a.score);

  const relevant = scored.filter((s) => s.score >= 3);
  if (relevant.length === 0) return { answer: fallbackResponse, matchedEntries: [] };

  const topScore = relevant[0].score;
  const topEntries = relevant.filter((s) => s.score >= topScore * 0.7);

  if (topEntries.length === 1 || new Set(topEntries.map((e) => e.entry.category)).size === 1) {
    return { answer: relevant[0].entry.answer, matchedEntries: [relevant[0].entry] };
  }
  if (topEntries.length <= 3) {
    const options = topEntries.slice(0, 3).map((e, i) => `${i + 1}. **${e.entry.question}**`).join('\n');
    return { answer: `${clarificationResponse}\n\n${options}`, matchedEntries: topEntries.map((e) => e.entry) };
  }
  return { answer: relevant[0].entry.answer, matchedEntries: [relevant[0].entry] };
}
