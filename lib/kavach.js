/**
 * Lightweight on-device Indian PII redactor matching Kavach's deterministic rule layer.
 * Used for the interactive mini-sandbox inside the Kavach project card.
 */

const RULES = [
  {
    type: 'AADHAAR',
    regex: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  },
  {
    type: 'PAN',
    regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  },
  {
    type: 'IFSC',
    regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  },
  {
    type: 'UPI',
    regex: /\b[a-zA-Z0-9._-]{2,}@(?:okaxis|okhdfcbank|okicici|oksbi|upi|ybl|paytm|ibl|axl)\b/gi,
  },
  {
    type: 'EMAIL',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  },
  {
    type: 'PHONE',
    regex: /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g,
  },
];

/**
 * Finds non-overlapping PII spans and replaces each with a deterministic placeholder token.
 */
export function redactIndianPII(input) {
  const text = typeof input === 'string' ? input : '';
  if (!text) {
    return { masked: '', segments: [], entities: [], count: 0 };
  }

  const candidates = [];
  for (const rule of RULES) {
    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(text)) !== null) {
      candidates.push({
        type: rule.type,
        start: match.index,
        end: match.index + match[0].length,
        raw: match[0],
      });
    }
  }

  // Sort by start offset ascending, longer span first on tie
  candidates.sort((a, b) => a.start - b.start || b.end - a.end);

  const accepted = [];
  let cursor = 0;
  for (const c of candidates) {
    if (c.start < cursor) continue;
    accepted.push(c);
    cursor = c.end;
  }

  const countsByType = Object.create(null);
  const entities = [];
  const segments = [];
  let pos = 0;
  let masked = '';

  for (const item of accepted) {
    if (item.start > pos) {
      const plain = text.slice(pos, item.start);
      segments.push({ kind: 'text', value: plain });
      masked += plain;
    }
    countsByType[item.type] = (countsByType[item.type] || 0) + 1;
    const token = `[${item.type}_${countsByType[item.type]}]`;
    entities.push({ type: item.type, raw: item.raw, token });
    segments.push({ kind: 'mask', value: token, type: item.type, raw: item.raw });
    masked += token;
    pos = item.end;
  }

  if (pos < text.length) {
    const tail = text.slice(pos);
    segments.push({ kind: 'text', value: tail });
    masked += tail;
  }

  return {
    masked,
    segments,
    entities,
    count: entities.length,
  };
}
