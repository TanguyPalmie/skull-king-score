import { knowledgeBase, fallbackResponse, clarificationResponse, type KnowledgeEntry } from './knowledgeBase';

/**
 * Normalize text for matching: lowercase, remove accents, strip punctuation.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[^a-z0-9\s]/g, ' ')   // replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize a string into words.
 */
function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter((w) => w.length > 1);
}

/**
 * Score an entry against the user's query.
 * Uses keyword matching + synonym expansion.
 */
function scoreEntry(entry: KnowledgeEntry, queryTokens: string[]): number {
  let score = 0;

  // Build expanded keyword set: entry keywords + all synonyms
  const allKeywords = new Set<string>();
  for (const kw of entry.keywords) {
    allKeywords.add(normalize(kw));
  }
  for (const [key, syns] of Object.entries(entry.synonyms)) {
    allKeywords.add(normalize(key));
    for (const s of syns) {
      allKeywords.add(normalize(s));
    }
  }

  // Match query tokens against keywords
  for (const token of queryTokens) {
    for (const kw of allKeywords) {
      if (kw === token) {
        score += 3; // exact match
      } else if (kw.includes(token) || token.includes(kw)) {
        score += 1; // partial match
      }
    }
  }

  // Bonus for matching normalized question words
  const questionTokens = tokenize(entry.question);
  for (const token of queryTokens) {
    if (questionTokens.includes(token)) {
      score += 2;
    }
  }

  return score;
}

export interface ChatbotResult {
  answer: string;
  matchedEntries: KnowledgeEntry[];
}

/**
 * Process a user query and return the best matching answer.
 */
export function processQuery(query: string): ChatbotResult {
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    return {
      answer: fallbackResponse,
      matchedEntries: [],
    };
  }

  // Score all entries
  const scored = knowledgeBase.map((entry) => ({
    entry,
    score: scoreEntry(entry, tokens),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Filter entries with meaningful scores
  const threshold = 3;
  const relevant = scored.filter((s) => s.score >= threshold);

  if (relevant.length === 0) {
    return {
      answer: fallbackResponse,
      matchedEntries: [],
    };
  }

  const topScore = relevant[0].score;
  const topEntries = relevant.filter((s) => s.score >= topScore * 0.7);

  // If clear winner (one top entry or top entries all same category)
  if (topEntries.length === 1 || new Set(topEntries.map((e) => e.entry.category)).size === 1) {
    return {
      answer: relevant[0].entry.answer,
      matchedEntries: [relevant[0].entry],
    };
  }

  // If ambiguous, show top 2-3 options
  if (topEntries.length <= 3) {
    const options = topEntries
      .slice(0, 3)
      .map((e, i) => `${i + 1}. **${e.entry.question}**`)
      .join('\n');
    return {
      answer: `${clarificationResponse}\n\n${options}`,
      matchedEntries: topEntries.map((e) => e.entry),
    };
  }

  // Default: return best match
  return {
    answer: relevant[0].entry.answer,
    matchedEntries: [relevant[0].entry],
  };
}
