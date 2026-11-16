#!/usr/bin/env node
// CI gate (job 1). Fails a pull request that changes a locked path without the `spec-change` label.
//
// Locked paths: spec/, contracts/, .github/workflows/, .claude/, tools/.
// One file under tools/ has its own rule: tools/trace-check/pending-requirements.txt may lose
// lines without the label (that is how a requirement gets implemented). It may gain a line only
// with the label (a new requirement enters the spec).
//
// Environment: BASE_SHA, HEAD_SHA, LABELS (JSON array of label names).

import { execFileSync } from 'node:child_process';

const LABEL = 'spec-change';
const LOCKED = ['spec/', 'contracts/', '.github/workflows/', '.claude/', 'tools/'];
const PENDING = 'tools/trace-check/pending-requirements.txt';

const { BASE_SHA: base, HEAD_SHA: head } = process.env;
const labels = JSON.parse(process.env.LABELS || '[]');
const labelled = labels.includes(LABEL);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const requirements = (ref) => {
  try {
    return git('show', `${ref}:${PENDING}`).split('\n').map((line) => line.trim()).filter((line) => line.startsWith('REQ-'));
  } catch {
    return [];
  }
};

const changed = git('diff', '--name-only', `${base}...${head}`).split('\n').filter(Boolean);
const lockedChanges = changed.filter((file) => file !== PENDING && LOCKED.some((prefix) => file.startsWith(prefix)));

const before = requirements(base);
const after = requirements(head);
const addedPending = after.filter((req) => !before.includes(req));
const removedPending = before.filter((req) => !after.includes(req));

console.log(`Gate: ${changed.length} changed file(s). Labels: ${labels.join(', ') || 'none'}.`);
if (removedPending.length > 0) console.log(`Requirements implemented by this change: ${removedPending.join(', ')}`);

const problems = [];
if (lockedChanges.length > 0) {
  problems.push(`locked path(s) changed:\n${lockedChanges.map((file) => `      ${file}`).join('\n')}`);
}
if (addedPending.length > 0) {
  problems.push(`requirement(s) added to the pending list: ${addedPending.join(', ')}`);
}

if (problems.length === 0) {
  console.log('GATE PASSED: no locked path changed.');
} else if (labelled) {
  console.log(`GATE PASSED with the "${LABEL}" label. The owner approved:`);
  for (const problem of problems) console.log(`  - ${problem}`);
} else {
  console.log(`GATE FAILED: this change needs the "${LABEL}" label, which only the owner sets.`);
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}
