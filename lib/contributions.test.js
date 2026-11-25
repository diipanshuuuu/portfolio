import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLevel,
  computeContributionStats,
  mergeContributionPayloads,
  buildWeekColumns,
  formatContributionLabel,
  parseGitHubContributionsHtml,
} from './contributions.js';

test('computeLevel maps counts across 0..4 quartiles cleanly', () => {
  assert.equal(computeLevel(0, 12), 0);
  assert.equal(computeLevel(1, 12), 1);
  assert.equal(computeLevel(3, 12), 1);
  assert.equal(computeLevel(6, 12), 2);
  assert.equal(computeLevel(9, 12), 3);
  assert.equal(computeLevel(12, 12), 4);
  assert.equal(computeLevel(1, 1), 4);
});

test('mergeContributionPayloads combines multiple accounts by date, tracks per-account totals and stats', () => {
  const merged = mergeContributionPayloads([
    {
      username: 'diipanshuuuu',
      contributions: [
        { date: '2026-10-01', count: 2 },
        { date: '2026-10-02', count: 0 },
        { date: 'bad-date', count: 99 },
      ],
    },
    {
      username: 'htmnsrc',
      contributions: [
        { date: '2026-10-01', count: 6 },
        { date: '2026-10-03', count: 4 },
      ],
    },
  ]);

  assert.equal(merged.total, 12);
  assert.equal(merged.maxCount, 8);
  assert.deepEqual(merged.byAccount, { diipanshuuuu: 2, htmnsrc: 10 });
  assert.equal(merged.stats.activeDays, 2);
  assert.deepEqual(merged.stats.busiestDay, { date: '2026-10-01', count: 8 });
  assert.equal(merged.stats.longestStreak, 1);
  assert.equal(merged.stats.currentStreak, 1);
  assert.deepEqual(merged.contributions, [
    { date: '2026-10-01', count: 8, level: 4 },
    { date: '2026-10-02', count: 0, level: 0 },
    { date: '2026-10-03', count: 4, level: 2 },
  ]);
});

test('computeContributionStats handles multi-day streaks and zero-today grace', () => {
  const stats = computeContributionStats([
    { date: '2026-11-18', count: 1 },
    { date: '2026-11-19', count: 5 },
    { date: '2026-11-20', count: 2 },
    { date: '2026-11-21', count: 0 },
  ]);
  assert.equal(stats.activeDays, 3);
  assert.equal(stats.longestStreak, 3);
  assert.equal(stats.currentStreak, 3);
  assert.deepEqual(stats.busiestDay, { date: '2026-11-19', count: 5 });
});

test('buildWeekColumns aligns days to Sun..Sat rows and trims to trailing maxWeeks', () => {
  const days = [];
  const start = Date.UTC(2026, 10, 15);
  for (let i = 0; i < 16; i++) {
    const dt = new Date(start + i * 86400000);
    const date = dt.toISOString().slice(0, 10);
    days.push({ date, count: i, level: i > 0 ? 1 : 0 });
  }

  const allWeeks = buildWeekColumns(days, 10);
  assert.equal(allWeeks.length, 3);
  assert.equal(allWeeks[0][0].date, '2026-11-15');
  assert.equal(allWeeks[0][6].date, '2026-11-21');
  assert.equal(allWeeks[2][0].date, '2026-11-29');
  assert.equal(allWeeks[2][1].date, '2026-11-30');
  assert.equal(allWeeks[2][2], null);

  const trimmed = buildWeekColumns(days, 2);
  assert.equal(trimmed.length, 2);
  assert.equal(trimmed[0][0].date, '2026-11-22');
});

test('formatContributionLabel produces clear singular, plural, and zero labels', () => {
  assert.equal(
    formatContributionLabel({ date: '2026-10-14', count: 0 }),
    'No contributions on Oct 14, 2026'
  );
  assert.equal(
    formatContributionLabel({ date: '2026-10-15', count: 1 }),
    '1 contribution on Oct 15, 2026'
  );
  assert.equal(
    formatContributionLabel({ date: '2026-10-18', count: 12 }),
    '12 contributions on Oct 18, 2026'
  );
});

test('parseGitHubContributionsHtml extracts counts and levels from GitHub contribution cells and tooltips', () => {
  const html = `
    <table>
      <tbody>
        <tr>
          <td tabindex="0" data-ix="52" data-date="2026-11-25" id="contribution-day-component-3-52" data-level="2" class="ContributionCalendar-day"></td>
          <tool-tip id="tooltip-3" for="contribution-day-component-3-52" popover="manual">3 contributions on November 25th.</tool-tip>
          <td id="contribution-day-component-2-52" class="ContributionCalendar-day" data-level="1" data-date="2026-11-24"></td>
          <tool-tip for="contribution-day-component-2-52">1 contribution on November 24th.</tool-tip>
          <td data-date="2026-11-23" id="contribution-day-component-1-52" data-level="0" class="ContributionCalendar-day"></td>
          <tool-tip for="contribution-day-component-1-52">No contributions on November 23rd.</tool-tip>
          <td data-date="2026-11-22" id="contribution-day-component-0-52" data-level="4" class="ContributionCalendar-day"></td>
          <tool-tip for="contribution-day-component-0-52">1,204 contributions on November 22nd.</tool-tip>
        </tr>
      </tbody>
    </table>
  `;

  assert.deepEqual(parseGitHubContributionsHtml(html), [
    { date: '2026-11-22', count: 1204, level: 4 },
    { date: '2026-11-23', count: 0, level: 0 },
    { date: '2026-11-24', count: 1, level: 1 },
    { date: '2026-11-25', count: 3, level: 2 },
  ]);

  assert.deepEqual(parseGitHubContributionsHtml(''), []);
  assert.deepEqual(parseGitHubContributionsHtml('<div>No calendar here</div>'), []);
  assert.deepEqual(parseGitHubContributionsHtml(null), []);
});

