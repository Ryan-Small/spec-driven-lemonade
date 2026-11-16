#!/usr/bin/env node
// Fail-first check (job 6). A new or changed scenario must fail without the change.
// A scenario that already passes on the base commit proves nothing about the change.
//
//   node tools/ci/fail-first.mjs targets <base-ref>
//       Prints the target scenarios: every scenario of a requirement that this change takes off
//       the pending list, plus every scenario whose text is new or changed in spec/features.
//       Writes them to reports/fail-first-targets.json.
//
//   node tools/ci/fail-first.mjs verify <reports-dir>
//       Reads the NDJSON reports of an acceptance run that used the BASE production code with
//       the HEAD tests. Fails if a target scenario passed.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PENDING = 'tools/trace-check/pending-requirements.txt';
const targetsFile = join(root, 'reports', 'fail-first-targets.json');

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const show = (ref, path) => {
  try {
    return git('show', `${ref}:${path}`);
  } catch {
    return '';
  }
};
const pendingOf = (text) => text.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('REQ-'));

/** Splits a feature file into scenarios: key "file|name" -> { reqs, text }. */
function scenariosOf(file, content) {
  const scenarios = new Map();
  let tags = [];
  let current = null;
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('@')) {
      current = null;
      tags = tags.concat(line.split(/\s+/));
      continue;
    }
    const start = /^Scenario(?: Outline)?:\s*(.*)$/.exec(line);
    if (start) {
      current = { reqs: tags.filter((tag) => /^@REQ-\d+$/.test(tag)).map((tag) => tag.slice(1)), text: tags.join(' ') };
      scenarios.set(`${file}|${start[1]}`, current);
      tags = [];
    } else if (/^(Rule|Feature|Background):/.test(line)) {
      current = null;
      tags = [];
    }
    if (current && line !== '') current.text += `\n${line}`;
  }
  return scenarios;
}

function targets(base) {
  const implemented = pendingOf(show(base, PENDING)).filter((req) => !pendingOf(readFileSync(join(root, PENDING), 'utf8')).includes(req));
  const stillPending = pendingOf(readFileSync(join(root, PENDING), 'utf8'));
  const result = [];
  const featuresDir = join(root, 'spec', 'features');
  for (const file of readdirSync(featuresDir).filter((name) => name.endsWith('.feature')).sort()) {
    const now = scenariosOf(file, readFileSync(join(featuresDir, file), 'utf8'));
    const before = scenariosOf(file, show(base, `spec/features/${file}`));
    for (const [key, scenario] of now) {
      if (scenario.reqs.every((req) => stillPending.includes(req))) continue;
      const old = before.get(key);
      let reason = null;
      if (scenario.reqs.some((req) => implemented.includes(req))) reason = 'requirement implemented by this change';
      else if (!old) reason = 'new scenario';
      else if (old.text !== scenario.text) reason = 'scenario text changed';
      if (reason) result.push({ key, reqs: scenario.reqs, reason });
    }
  }
  mkdirSync(dirname(targetsFile), { recursive: true });
  writeFileSync(targetsFile, JSON.stringify(result, null, 2));
  console.log(`Fail-first targets against ${base}: ${result.length}`);
  for (const target of result) console.log(`  - [${target.reqs.join(' ')}] ${target.key.replace('|', ': ')} (${target.reason})`);
}

function verify(reportsDir) {
  const wanted = JSON.parse(readFileSync(targetsFile, 'utf8'));
  const outcomes = new Map(); // key -> statuses
  const files = existsSync(reportsDir) ? readdirSync(reportsDir).filter((name) => name.endsWith('.ndjson')) : [];
  for (const file of files) {
    const pickles = new Map();
    const testCases = new Map();
    const started = new Map();
    for (const line of readFileSync(join(reportsDir, file), 'utf8').split('\n')) {
      if (line.trim() === '') continue;
      const message = JSON.parse(line);
      if (message.pickle) pickles.set(message.pickle.id, `${basename(message.pickle.uri)}|${message.pickle.name}`);
      else if (message.testCase) testCases.set(message.testCase.id, message.testCase.pickleId);
      else if (message.testCaseStarted) started.set(message.testCaseStarted.id, { pickleId: testCases.get(message.testCaseStarted.testCaseId), statuses: [] });
      else if (message.testStepFinished) started.get(message.testStepFinished.testCaseStartedId)?.statuses.push(message.testStepFinished.testStepResult.status);
    }
    for (const run of started.values()) {
      const key = pickles.get(run.pickleId);
      const passed = run.statuses.length > 0 && run.statuses.every((status) => status === 'PASSED');
      if (!outcomes.has(key)) outcomes.set(key, []);
      outcomes.get(key).push(passed ? 'PASSED' : (run.statuses.find((status) => status !== 'PASSED') ?? 'NO_STEPS'));
    }
  }

  console.log(`Fail-first verification — ${wanted.length} target scenario(s), base production code with head tests\n`);
  const offenders = [];
  for (const target of wanted) {
    const runs = outcomes.get(target.key) ?? [];
    const label = target.key.replace('|', ': ');
    if (runs.length === 0) {
      console.log(`OK    did not run on base (the build or the run broke without the change): ${label}`);
    } else if (runs.every((status) => status === 'PASSED')) {
      console.log(`FAIL  PASSES on base: ${label}`);
      offenders.push(label);
    } else {
      console.log(`OK    fails on base (${[...new Set(runs)].join(', ')}): ${label}`);
    }
  }
  if (offenders.length > 0) {
    console.log(`\nFAIL-FIRST FAILED: ${offenders.length} scenario(s) pass without the change. They do not test the change.`);
    process.exit(1);
  }
  console.log('\nFAIL-FIRST PASSED');
}

const [command, argument] = process.argv.slice(2);
if (command === 'targets' && argument) targets(argument);
else if (command === 'verify' && argument) verify(argument);
else {
  console.error('Usage: fail-first.mjs targets <base-ref> | verify <reports-dir>');
  process.exit(2);
}
