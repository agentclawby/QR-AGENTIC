// User-supplied strings that flow into Claude prompts need defensive
// sanitization. We can't make injection impossible (the model is the parser),
// but we can strip the cheap, well-known attack patterns so that the surface
// is "model interprets the text as text" rather than "model interprets the
// text as a new instruction header."

const INJECTION_PATTERNS: RegExp[] = [
  /\bignore (?:the )?(?:previous|prior|above|all) (?:instructions?|messages?|prompts?)\b/gi,
  /\bdisregard (?:the )?(?:previous|prior|above|all) (?:instructions?|messages?|prompts?)\b/gi,
  /\bforget (?:the )?(?:previous|prior|above|all) (?:instructions?|messages?|prompts?)\b/gi,
  /\boverride (?:the )?(?:previous|prior|above|all) (?:instructions?|messages?|prompts?)\b/gi,
  /\bnew (?:instructions?|task|directive|prompt)\s*[:>-]/gi,
  /\b(?:system|assistant|user)\s*[:>-]\s*you (?:are|will|must|should)\b/gi,
  /<\|im_(?:start|end)\|>/gi,
  /<\|(?:system|user|assistant)\|>/gi,
  /\[INST\]|\[\/INST\]/gi,
  /\[SYSTEM\]|\[\/SYSTEM\]/gi,
  /\bact as (?:if you (?:are|were)|a different)\b/gi,
  /\bpretend (?:you (?:are|were)|to be)\b/gi,
  /\bjailbreak\b/gi,
  /\bDAN mode\b/gi,
];

/**
 * Strip control characters, normalize whitespace, and neutralize the most
 * common prompt-injection markers. Returns the cleaned string; throws if the
 * cleaned string is empty after sanitization.
 *
 * The sanitizer is intentionally conservative: it replaces matches with
 * `[redacted]` rather than removing them so a) the user-supplied text still
 * makes grammatical sense and b) operators can grep logs for `[redacted]`
 * tokens when investigating abuse.
 */
export function sanitizeUserPrompt(input: string): string {
  let cleaned = input
    // Strip ASCII control characters except \n and \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Strip zero-width / direction-override unicode (homoglyph & override tricks)
    .replace(/[​-‏‪-‮⁠-⁯﻿]/g, "")
    // Collapse runs of 3+ newlines to 2 (limits "shouting" prompt structure)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[redacted]");
  }

  if (!cleaned) {
    throw new Error("Input is empty after sanitization");
  }

  return cleaned;
}
