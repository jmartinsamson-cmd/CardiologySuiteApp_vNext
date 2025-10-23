// @ts-nocheck
/* stylelint-disable */
/* eslint-env node */
/* global fetch */
/**
 * Audit and update pinned GitHub Action SHAs in .github/workflows/*.yml
 * - For a curated allowlist of actions, finds the latest tag for the same major version
 * - Resolves the tag to a commit SHA
 * - Rewrites uses: owner/repo@<sha> and keeps a trailing comment with tag, e.g. # v4.1.7
 *
 * Outputs:
 * - writes to GITHUB_OUTPUT: changed=true|false, summary (markdown path), changes (JSON)
 */

import fs from 'node:fs';
import path from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || '';
const WORKFLOWS_DIR = path.resolve('.github/workflows');

const allow = [
  { owner: 'actions', repo: 'checkout', major: 4 },
  { owner: 'actions', repo: 'setup-node', major: 4 },
  { owner: 'actions', repo: 'github-script', major: 7 },
  { owner: 'actions', repo: 'setup-python', major: 5 },
  { owner: 'actions', repo: 'dependency-review-action', major: 4 },
  { owner: 'github', repo: 'codeql-action', major: 3, sub: 'upload-sarif' },
  { owner: 'actions', repo: 'upload-artifact', major: 4 },
  { owner: 'gitleaks', repo: 'gitleaks-action', major: 2 },
  { owner: 'codacy', repo: 'codacy-analysis-cli-action', major: 4 },
  { owner: 'actions', repo: 'ai-inference', major: 2 },
  { owner: 'andresz1', repo: 'size-limit-action', major: 1 },
  { owner: 'Azure', repo: 'static-web-apps-deploy', major: 1 },
];

function semverCompare(a, b) {
  // a, b like 'v4.1.7'
  const pa = a.replace(/^v/, '').split('.').map(n => Number.parseInt(n || '0', 10));
  const pb = b.replace(/^v/, '').split('.').map(n => Number.parseInt(n || '0', 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da - db;
  }
  return 0;
}

async function gh(pathname) {
  const url = `https://api.github.com${pathname}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'pinned-actions-audit-script'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${pathname} failed: ${res.status} ${res.statusText} -> ${text}`);
  }
  return res.json();
}

async function resolveLatest(owner, repo, major) {
  // Prefer matching-refs to get tags for a major stream
  const refs = await gh(`/repos/${owner}/${repo}/git/matching-refs/tags/v${major}`);
  if (!Array.isArray(refs) || refs.length === 0) return null;
  // Sort by semantic version
  const tags = refs.map(r => r.ref.replace('refs/tags/', ''));
  tags.sort(semverCompare);
  const latestTag = tags.at(-1);
  // Resolve tag to SHA
  const refObj = refs.find(r => r.ref.endsWith(latestTag));
  const sha = refObj?.object?.sha;
  return { tag: latestTag, sha };
}

async function main() {
  const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  const changes = [];

  for (const file of files) {
    const full = path.join(WORKFLOWS_DIR, file);
    let content = fs.readFileSync(full, 'utf8');
    let updated = false;

    for (const a of allow) {
      // Build regex to match uses: owner/repo(/{sub})?@<sha or tag> [# comment]
      const sub = a.sub ? `/${a.sub}` : '';
      const re = new RegExp(String.raw`(uses:\s*${a.owner}\/${a.repo}${sub}@)([^\s#]+)(\s*(#\s*[^\n]*)?)`, 'g');
      const latest = await resolveLatest(a.owner, a.repo, a.major).catch(() => null);
      if (!latest || !latest.sha) continue;

      content = content.replace(re, (fullMatch, p1, ref) => {
        if (ref === latest.sha) return fullMatch; // already latest
        updated = true;
        changes.push({ file, action: `${a.owner}/${a.repo}${sub}`, from: ref, to: latest.sha, tag: latest.tag });
        const comment = ` # ${latest.tag}`;
        return `${p1}${latest.sha}${comment}`;
      });
    }

    if (updated) {
      fs.writeFileSync(full, content, 'utf8');
    }
  }

  const summaryPath = path.resolve('audit-actions-summary.md');
  if (changes.length > 0) {
    const lines = [
      '# Pinned Actions Audit',
      '',
      'The following action pins were updated to the latest SHA for their major versions:',
      '',
      '| File | Action | From | To | Tag |',
      '|------|--------|------|----|-----|',
      ...changes.map(c => `| ${c.file} | ${c.action} | ${c.from} | ${c.to} | ${c.tag} |`),
      '',
    ];
    fs.writeFileSync(summaryPath, lines.join('\n'), 'utf8');
  }

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    fs.appendFileSync(out, `changed=${changes.length > 0}\n`);
    fs.appendFileSync(out, `summary=${summaryPath}\n`);
    fs.appendFileSync(out, `changes=${JSON.stringify(changes)}\n`);
  } else {
    console.log(JSON.stringify({ changed: changes.length > 0, summary: summaryPath, changes }, null, 2));
  }
}

try {
  await main();
} catch (err) {
  console.error(err?.stack || String(err));
  process.exit(1);
}
