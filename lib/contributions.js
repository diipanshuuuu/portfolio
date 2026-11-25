const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Computes GitHub-style intensity level (0..4) from a day's count and the max daily count.
 */
export function computeLevel(count, maxCount) {
  if (!Number.isFinite(count) || count <= 0) return 0;
  if (!Number.isFinite(maxCount) || maxCount <= 1) return 4;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Computes activity summary stats (active days, busiest day, streaks) from sorted daily contributions.
 */
export function computeContributionStats(contributions) {
  if (!Array.isArray(contributions) || contributions.length === 0) {
    return {
      activeDays: 0,
      busiestDay: null,
      longestStreak: 0,
      currentStreak: 0,
    };
  }

  let activeDays = 0;
  let busiestDay = null;
  let longestStreak = 0;
  let running = 0;

  for (const day of contributions) {
    const count = Number(day?.count) || 0;
    if (count > 0) {
      activeDays += 1;
      running += 1;
      if (running > longestStreak) longestStreak = running;
      if (!busiestDay || count > busiestDay.count) {
        busiestDay = { date: day.date, count };
      }
    } else {
      running = 0;
    }
  }

  // Current streak: count backwards from last day (allowing today to be 0 if yesterday was active)
  let currentStreak = 0;
  let idx = contributions.length - 1;
  if (idx >= 0 && (Number(contributions[idx]?.count) || 0) === 0) {
    idx -= 1;
  }
  while (idx >= 0 && (Number(contributions[idx]?.count) || 0) > 0) {
    currentStreak += 1;
    idx -= 1;
  }

  return { activeDays, busiestDay, longestStreak, currentStreak };
}

/**
 * Merges one or more GitHub contributions API payloads into a single chronological list.
 * Each entry can be `{ username?, contributions: [...] }`.
 */
export function mergeContributionPayloads(payloads) {
  const byDate = new Map();
  const byAccount = {};

  for (const payload of payloads) {
    const items = Array.isArray(payload?.contributions) ? payload.contributions : [];
    let accountTotal = 0;
    for (const item of items) {
      if (!item || typeof item.date !== 'string' || !DATE_RE.test(item.date)) continue;
      const count = Number.isFinite(Number(item.count)) ? Math.max(0, Math.floor(Number(item.count))) : 0;
      byDate.set(item.date, (byDate.get(item.date) || 0) + count);
      accountTotal += count;
    }
    if (payload && typeof payload.username === 'string' && payload.username) {
      byAccount[payload.username] = accountTotal;
    }
  }

  const dates = Array.from(byDate.keys()).sort();
  let total = 0;
  let maxCount = 0;

  for (const date of dates) {
    const count = byDate.get(date);
    total += count;
    if (count > maxCount) maxCount = count;
  }

  const contributions = dates.map((date) => {
    const count = byDate.get(date);
    return {
      date,
      count,
      level: computeLevel(count, maxCount),
    };
  });

  const stats = computeContributionStats(contributions);

  return { total, maxCount, byAccount, stats, contributions };
}

/**
 * Groups sorted daily contribution records into Sunday-to-Saturday week columns,
 * returning the trailing `maxWeeks` weeks (default 38 to match the compact 42rem grid).
 */
export function buildWeekColumns(contributions, maxWeeks = 38) {
  if (!Array.isArray(contributions) || contributions.length === 0) return [];

  const weeks = [];
  let currentWeek = new Array(7).fill(null);

  for (const day of contributions) {
    if (!day || typeof day.date !== 'string' || !DATE_RE.test(day.date)) continue;
    const [y, m, d] = day.date.split('-').map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun .. 6 = Sat

    if (dow === 0 && currentWeek.some((slot) => slot !== null)) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(null);
    }
    currentWeek[dow] = day;
  }

  if (currentWeek.some((slot) => slot !== null)) {
    weeks.push(currentWeek);
  }

  if (maxWeeks > 0 && weeks.length > maxWeeks) {
    return weeks.slice(weeks.length - maxWeeks);
  }
  return weeks;
}

/**
 * Formats a human-readable tooltip label for a contribution cell.
 */
export function formatContributionLabel(day) {
  if (!day || typeof day.date !== 'string' || !DATE_RE.test(day.date)) return '';
  const [y, m, d] = day.date.split('-').map(Number);
  const month = MONTHS[m - 1] || '';
  const count = Number(day.count) || 0;
  const prefix =
    count === 0
      ? 'No contributions'
      : count === 1
        ? '1 contribution'
        : `${count} contributions`;
  return `${prefix} on ${month} ${d}, ${y}`;
}

/**
 * Parses GitHub's public `/users/<username>/contributions` HTML fragment into
 * chronological `{ date, count, level }` entries.
 */
export function parseGitHubContributionsHtml(html) {
  if (typeof html !== 'string' || !html) return [];

  const tooltipCounts = new Map();
  const tooltipRe = /<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/gi;
  let match;

  while ((match = tooltipRe.exec(html)) !== null) {
    const attrs = match[1] || '';
    const forMatch = /\bfor=["']([^"']+)["']/i.exec(attrs);
    if (!forMatch) continue;

    const text = (match[2] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/\bNo contributions?\b/i.test(text)) {
      tooltipCounts.set(forMatch[1], 0);
      continue;
    }

    const countMatch = /(\d[\d,]*)\s+contributions?\b/i.exec(text);
    if (countMatch) {
      const parsed = Number.parseInt(countMatch[1].replace(/,/g, ''), 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        tooltipCounts.set(forMatch[1], parsed);
      }
    }
  }

  const byDate = new Map();
  const cellRe = /<td\b([^>]*)>/gi;

  while ((match = cellRe.exec(html)) !== null) {
    const attrs = match[1] || '';
    const dateMatch = /\bdata-date=["'](\d{4}-\d{2}-\d{2})["']/i.exec(attrs);
    if (!dateMatch) continue;

    const date = dateMatch[1];
    const idMatch = /\bid=["']([^"']+)["']/i.exec(attrs);
    const levelMatch = /\bdata-level=["']([0-4])["']/i.exec(attrs);
    const dataCountMatch = /\bdata-count=["'](\d+)["']/i.exec(attrs);

    const level = levelMatch ? Number.parseInt(levelMatch[1], 10) : 0;
    let count;
    if (idMatch && tooltipCounts.has(idMatch[1])) {
      count = tooltipCounts.get(idMatch[1]);
    } else if (dataCountMatch) {
      count = Number.parseInt(dataCountMatch[1], 10);
    } else {
      count = level;
    }

    byDate.set(date, { date, count, level });
  }

  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

