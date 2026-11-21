import type { DocumentExplanation } from "@/api/explain";

const MISSING_VALUE_PATTERNS = new Set([
  // Polish
  "brak",
  "brak w piśmie",
  "brak informacji",
  "brak informacji w piśmie",
  "brak danych",
  "brak danych w piśmie",
  "brak terminu",
  "brak terminów",
  "brak terminu w piśmie",
  "brak terminów w piśmie",
  "brak kwoty",
  "brak kwoty w piśmie",
  "brak podsumowania",
  "brak podsumowania w piśmie",
  "nie dotyczy",
  "nie podano",
  "nie wskazano",
  "nie określono",
  // English
  "missing in the letter",
  "not in the letter",
  "not mentioned in the letter",
  "not specified in the letter",
  "no deadline",
  "no deadlines",
  "no deadline in the letter",
  "no deadlines in the letter",
  "no amount",
  "no amount in the letter",
  "none",
  "n/a",
  // Ukrainian
  "немає в листі",
  "відсутнє в листі",
  "не вказано в листі",
  "не зазначено в листі",
  "немає терміну",
  "немає терміну в листі",
  "немає суми",
  "немає суми в листі",
]);

function normalizeForSentinelCheck(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.!;:]+$/g, "")
    .replace(/\s+/g, " ");
}

export function isMissingLetterValue(value: string | null | undefined) {
  if (!value) return true;
  const normalized = normalizeForSentinelCheck(value);
  return normalized.length === 0 || MISSING_VALUE_PATTERNS.has(normalized);
}

export type NormalizedKeyFacts = {
  deadlines: string[];
  amount: string | null;
  summary: string | null;
};

export function extractKeyFacts(
  explanation: Pick<DocumentExplanation, "deadlines" | "amount" | "summary">,
): NormalizedKeyFacts {
  const deadlines = (explanation.deadlines ?? [])
    .map((item) => item.trim())
    .filter((item) => !isMissingLetterValue(item));

  const amount = isMissingLetterValue(explanation.amount)
    ? null
    : explanation.amount.trim();

  const summary = isMissingLetterValue(explanation.summary)
    ? null
    : explanation.summary.trim();

  return { deadlines, amount, summary };
}
