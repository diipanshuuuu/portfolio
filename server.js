import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeContributionPayloads, parseGitHubContributionsHtml } from './lib/contributions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_ACCOUNTS = Object.freeze(['diipanshuuuu', 'htmnsrc']);
const GITHUB_REPOS = Object.freeze([
  'diipanshuuuu/Kool-PlayGround',
  'diipanshuuuu/LLM-Pipeline-Explorer',
  'diipanshuuuu/Kavach',
  'htmnsrc/SysCleanX',
  'diipanshuuuu/NST-SDC-site',
]);
const GITHUB_WEB_ORIGIN = 'https://github.com';
const CONTRIBUTIONS_API_ORIGIN = 'https://github-contributions-api.jogruber.de';
const GITHUB_API_ORIGIN = 'https://api.github.com';
const CONTRIB_CACHE_TTL_MS = 2 * 60 * 1000;
const REPO_CACHE_TTL_MS = 30 * 60 * 1000;

const BLOCKED_PREFIXES = ['/node_modules', '/design-system', '/lib', '/public'];
const BLOCKED_FILES = new Set([
  '/server.js',
  '/server.test.js',
  '/package.json',
  '/package-lock.json',
  '/firebase.json',
  '/README.md',
]);

export function isBlockedPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return true;
  }

  const normalized = path.posix.normalize(decoded);
  const segments = normalized.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) {
    return true;
  }
  if (BLOCKED_FILES.has(normalized)) {
    return true;
  }
  return BLOCKED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

async function fetchAccountContributionsFromGitHub(username, fetchImpl) {
  const url = `${GITHUB_WEB_ORIGIN}/users/${encodeURIComponent(username)}/contributions`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'text/html',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'dipanshu-portfolio',
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) {
    throw new Error(`GitHub contributions HTTP ${response.status} for ${username}`);
  }
  const html = await response.text();
  const contributions = parseGitHubContributionsHtml(html);
  if (!contributions.length) {
    throw new Error(`GitHub contributions HTML yielded 0 days for ${username}`);
  }
  return { username, contributions };
}

async function fetchAccountContributionsFallback(username, fetchImpl) {
  const url = `${CONTRIBUTIONS_API_ORIGIN}/v4/${encodeURIComponent(username)}?y=last`;
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'dipanshu-portfolio' },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) {
    throw new Error(`Fallback contributions HTTP ${response.status} for ${username}`);
  }
  const data = await response.json();
  return { username, contributions: data?.contributions || [] };
}

async function fetchLiveContributions(fetchImpl = fetch) {
  const results = await Promise.allSettled(
    GITHUB_ACCOUNTS.map(async (username) => {
      try {
        return await fetchAccountContributionsFromGitHub(username, fetchImpl);
      } catch {
        return await fetchAccountContributionsFallback(username, fetchImpl);
      }
    })
  );

  const payloads = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  if (!payloads.length) {
    throw new Error('Could not reach GitHub contributions upstream');
  }

  return mergeContributionPayloads(payloads);
}

async function fetchLiveRepoMeta(fetchImpl = fetch) {
  const results = await Promise.allSettled(
    GITHUB_REPOS.map(async (slug) => {
      const [owner, repo] = slug.split('/');
      const url = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const response = await fetchImpl(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'dipanshu-portfolio',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) {
        throw new Error(`GitHub repo HTTP ${response.status} for ${slug}`);
      }
      const data = await response.json();
      return [
        slug,
        {
          stars: Number.isFinite(Number(data?.stargazers_count))
            ? Math.max(0, Math.floor(Number(data.stargazers_count)))
            : 0,
          pushedAt: typeof data?.pushed_at === 'string' ? data.pushed_at : null,
        },
      ];
    })
  );

  const repos = {};
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      const [slug, meta] = r.value;
      repos[slug] = meta;
    }
  }

  if (!Object.keys(repos).length) {
    throw new Error('Could not reach GitHub repo metadata upstream');
  }

  return { repos };
}

export function createApp(staticDir = __dirname, options = {}) {
  const app = express();
  const fetchImpl = options.fetchImpl || fetch;

  let cachedContrib = null;
  let cachedContribAt = 0;
  let contribInFlight = null;

  let cachedRepos = null;
  let cachedReposAt = 0;
  let reposInFlight = null;

  app.get('/api/github-contributions', async (_req, res) => {
    const now = Date.now();
    if (cachedContrib && now - cachedContribAt < CONTRIB_CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json(cachedContrib);
    }

    try {
      if (!contribInFlight) {
        contribInFlight = fetchLiveContributions(fetchImpl).finally(() => {
          contribInFlight = null;
        });
      }
      const merged = await contribInFlight;
      cachedContrib = {
        accounts: GITHUB_ACCOUNTS,
        total: merged.total,
        byAccount: merged.byAccount,
        stats: merged.stats,
        contributions: merged.contributions,
      };
      cachedContribAt = Date.now();
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json(cachedContrib);
    } catch {
      if (cachedContrib) {
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.json(cachedContrib);
      }
      return res.status(502).json({ error: 'Unable to load GitHub contributions right now' });
    }
  });

  app.get('/api/github-repos', async (_req, res) => {
    const now = Date.now();
    if (cachedRepos && now - cachedReposAt < REPO_CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'public, max-age=900');
      return res.json(cachedRepos);
    }

    try {
      if (!reposInFlight) {
        reposInFlight = fetchLiveRepoMeta(fetchImpl).finally(() => {
          reposInFlight = null;
        });
      }
      const data = await reposInFlight;
      cachedRepos = data;
      cachedReposAt = Date.now();
      res.setHeader('Cache-Control', 'public, max-age=900');
      return res.json(cachedRepos);
    } catch {
      if (cachedRepos) {
        res.setHeader('Cache-Control', 'public, max-age=300');
        return res.json(cachedRepos);
      }
      return res.status(502).json({ error: 'Unable to load GitHub repo stats right now' });
    }
  });

  app.use((req, res, next) => {
    if (isBlockedPath(req.path)) {
      return res.status(404).type('text/plain').send('Not Found');
    }
    next();
  });

  app.use(
    express.static(staticDir, {
      dotfiles: 'ignore',
      index: 'index.html',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
      },
    })
  );

  return app;
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);
  } catch {
    return path.resolve(process.argv[1]) === __filename;
  }
}

function resolveListenPort() {
  const defaultPort = Number(process.env.DEFAULT_APP_PORT) || 3000;
  const rawPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  if (!Number.isFinite(rawPort) || rawPort <= 0) return defaultPort;
  // Avoid colliding with the container's reverse proxy if PORT=8080 is inherited
  if (Number.isFinite(nginxPort) && nginxPort > 0 && rawPort === nginxPort) {
    return defaultPort;
  }
  return rawPort;
}

if (isDirectExecution()) {
  const PORT = resolveListenPort();
  const HOST = '0.0.0.0';
  const app = createApp();
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
