import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp, isBlockedPath } from './server.js';

test('isBlockedPath blocks dotfiles and internal server/config files', () => {
  assert.equal(isBlockedPath('/.firebaserc'), true);
  assert.equal(isBlockedPath('/.gitignore'), true);
  assert.equal(isBlockedPath('/server.js'), true);
  assert.equal(isBlockedPath('/package.json'), true);
  assert.equal(isBlockedPath('/firebase.json'), true);
  assert.equal(isBlockedPath('/node_modules/express/index.js'), true);
  assert.equal(isBlockedPath('/design-system/portfolio/MASTER.md'), true);
  assert.equal(isBlockedPath('/lib/contributions.js'), true);
  assert.equal(isBlockedPath('/lib/kavach.js'), true);
  assert.equal(isBlockedPath('/%2eenv'), true);
});

test('isBlockedPath allows public portfolio assets and SEO files', () => {
  assert.equal(isBlockedPath('/'), false);
  assert.equal(isBlockedPath('/index.html'), false);
  assert.equal(isBlockedPath('/styles.css'), false);
  assert.equal(isBlockedPath('/script.js'), false);
  assert.equal(isBlockedPath('/favicon.svg'), false);
  assert.equal(isBlockedPath('/og-image.jpg'), false);
  assert.equal(isBlockedPath('/robots.txt'), false);
  assert.equal(isBlockedPath('/sitemap.xml'), false);
  assert.equal(isBlockedPath('/resume.pdf'), false);
  assert.equal(isBlockedPath('/resume/resume.html'), false);
});

test('server serves static assets, /api/github-contributions from GitHub HTML with fallback, and /api/github-repos', async () => {
  let githubHtmlCalls = 0;
  let fallbackApiCalls = 0;
  let repoFetchCalls = 0;

  const stubFetch = async (url) => {
    const s = String(url);
    if (s.includes('github.com/users/')) {
      githubHtmlCalls += 1;
      if (s.includes('diipanshuuuu')) {
        return {
          ok: true,
          status: 200,
          text: async () => `
            <table><tbody><tr>
              <td data-date="2026-11-20" id="c-1" data-level="2" class="ContributionCalendar-day"></td>
              <tool-tip for="c-1">3 contributions on November 20th.</tool-tip>
              <td data-date="2026-11-21" id="c-2" data-level="1" class="ContributionCalendar-day"></td>
              <tool-tip for="c-2">1 contribution on November 21st.</tool-tip>
            </tr></tbody></table>
          `,
        };
      }
      // Simulate GitHub HTML failure for second account to verify fallback works seamlessly
      return { ok: false, status: 503, text: async () => '' };
    }

    if (s.includes('github-contributions-api')) {
      fallbackApiCalls += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          contributions: [
            { date: '2026-11-20', count: 2, level: 2 },
            { date: '2026-11-22', count: 4, level: 4 },
          ],
        }),
      };
    }

    if (s.includes('api.github.com/repos/')) {
      repoFetchCalls += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          stargazers_count: 7,
          pushed_at: '2026-11-20T12:00:00Z',
        }),
      };
    }

    throw new Error('Unexpected fetch url: ' + s);
  };

  const app = createApp(undefined, { fetchImpl: stubFetch });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const homeRes = await fetch(`${baseUrl}/`);
    assert.equal(homeRes.status, 200);
    assert.match(homeRes.headers.get('content-type') || '', /text\/html/);

    const contribRes = await fetch(`${baseUrl}/api/github-contributions`);
    assert.equal(contribRes.status, 200);
    assert.equal(contribRes.headers.get('cache-control'), 'public, max-age=60');
    const contribJson = await contribRes.json();
    assert.equal(contribJson.total, 10);
    assert.deepEqual(contribJson.byAccount, { diipanshuuuu: 4, htmnsrc: 6 });
    assert.equal(contribJson.stats.activeDays, 3);
    assert.equal(githubHtmlCalls, 2);
    assert.equal(fallbackApiCalls, 1);

    // Cached hit
    const cachedContribRes = await fetch(`${baseUrl}/api/github-contributions`);
    assert.equal(cachedContribRes.status, 200);
    assert.equal(githubHtmlCalls, 2);
    assert.equal(fallbackApiCalls, 1);

    // Repo metadata endpoint
    const reposRes = await fetch(`${baseUrl}/api/github-repos`);
    assert.equal(reposRes.status, 200);
    const reposJson = await reposRes.json();
    assert.equal(reposJson.repos['diipanshuuuu/Kool-PlayGround'].stars, 7);
    assert.equal(reposJson.repos['diipanshuuuu/LLM-Pipeline-Explorer'].stars, 7);
    assert.equal(reposJson.repos['diipanshuuuu/Kavach'].stars, 7);
    assert.equal(reposJson.repos['htmnsrc/SysCleanX'].stars, 7);
    assert.equal(reposJson.repos['diipanshuuuu/NST-SDC-site'].stars, 7);
    assert.equal(repoFetchCalls, 5);

    // Cached hit for repos
    const cachedReposRes = await fetch(`${baseUrl}/api/github-repos`);
    assert.equal(cachedReposRes.status, 200);
    assert.equal(repoFetchCalls, 5);

    const blockedRes = await fetch(`${baseUrl}/lib/kavach.js`);
    assert.equal(blockedRes.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

