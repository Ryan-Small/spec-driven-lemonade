#!/usr/bin/env node
// Traceability check: spec -> test.
//
// Reads the locked feature files, the pending-requirements list, and the Cucumber
// "message" reports (NDJSON) that the acceptance runs write to reports/.
//
// It fails if:
//   1. a scenario has no @REQ tag or no layer tag, or its @REQ tag names no Rule
//   2. a Rule has no scenario
//   3. the pending list names a REQ that does not exist
//   4. a scenario of an implemented (not pending) REQ has no passing run in the reports
//   5. an implemented REQ has no passing scenario at all
//
// Usage: node tools/trace-check/trace-check.mjs [--layers=api,ui,e2e]
//   --layers  the layers whose reports this run has. Scenarios of other layers are not required.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const featuresDir = join(root, 'spec', 'features');
const reportsDir = join(root, 'reports');
const pendingFile = join(root, 'tools', 'trace-check', 'pending-requirements.txt');

const layersArg = process.argv.find((arg) => arg.startsWith('--layers='));
const layers = (layersArg ? layersArg.slice('--layers='.length) : 'api,ui,e2e').split(',');
const ALL_LAYERS = ['api', 'ui', 'e2e'];

const errors = [];

// --- 1. The spec: rules and scenarios from the feature files -------------------------------

const rules = new Map(); // REQ id -> { file, text }
const scenarios = []; // { file, name, reqs, layers }

for (const file of readdirSync(featuresDir).filter((name) => name.endsWith('.feature')).sort()) {
  let tags = [];
  for (const raw of readFileSync(join(featuresDir, file), 'utf8').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('@')) {
      tags = tags.concat(line.split(/\s+/));
      continue;
    }
    const rule = /^Rule:\s*(REQ-\d+)\s+(.*)$/.exec(line);
    if (rule) {
      if (rules.has(rule[1])) errors.push(`${file}: ${rule[1]} is defined twice`);
      rules.set(rule[1], { file, text: rule[2] });
    } else if (/^Rule:/.test(line)) {
      errors.push(`${file}: a Rule has no REQ ID: "${line}"`);
    }
    const scenario = /^Scenario(?: Outline)?:\s*(.*)$/.exec(line);
    if (scenario) {
      scenarios.push({
        file,
        name: scenario[1],
        reqs: tags.filter((tag) => /^@REQ-\d+$/.test(tag)).map((tag) => tag.slice(1)),
        layers: tags.filter((tag) => ALL_LAYERS.includes(tag.slice(1))).map((tag) => tag.slice(1)),
      });
    }
    if (line !== '') tags = [];
  }
}

for (const scenario of scenarios) {
  const where = `${scenario.file}: scenario "${scenario.name}"`;
  if (scenario.reqs.length === 0) errors.push(`${where} has no @REQ tag`);
  if (scenario.layers.length !== 1) errors.push(`${where} needs exactly one layer tag (@api, @ui or @e2e)`);
  for (const req of scenario.reqs) {
    if (!rules.has(req)) errors.push(`${where} is tagged @${req}, and no Rule has that ID`);
  }
}
for (const req of rules.keys()) {
  if (!scenarios.some((scenario) => scenario.reqs.includes(req))) errors.push(`${req} has no scenario`);
}

// --- 2. The pending list ---------------------------------------------------------------------

const pending = new Set(
  readFileSync(pendingFile, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('REQ-')),
);
for (const req of pending) {
  if (!rules.has(req)) errors.push(`pending-requirements.txt names ${req}, and no Rule has that ID`);
}

// --- 3. The evidence: scenario results from the NDJSON reports -------------------------------

const results = new Map(); // "file|name" -> array of statuses, one per executed scenario (pickle)

const reportFiles = existsSync(reportsDir)
  ? readdirSync(reportsDir).filter((name) => name.endsWith('.ndjson')).sort()
  : [];

for (const reportFile of reportFiles) {
  const pickles = new Map(); // pickle id -> key
  const testCases = new Map(); // testCase id -> pickle id
  const started = new Map(); // testCaseStarted id -> { pickleId, statuses }
  for (const line of readFileSync(join(reportsDir, reportFile), 'utf8').split('\n')) {
    if (line.trim() === '') continue;
    const message = JSON.parse(line);
    if (message.pickle) {
      pickles.set(message.pickle.id, `${basename(message.pickle.uri)}|${message.pickle.name}`);
    } else if (message.testCase) {
      testCases.set(message.testCase.id, message.testCase.pickleId);
    } else if (message.testCaseStarted) {
      started.set(message.testCaseStarted.id, {
        pickleId: testCases.get(message.testCaseStarted.testCaseId),
        statuses: [],
      });
    } else if (message.testStepFinished) {
      started.get(message.testStepFinished.testCaseStartedId)?.statuses.push(message.testStepFinished.testStepResult.status);
    }
  }
  for (const run of started.values()) {
    const key = pickles.get(run.pickleId);
    const passed = run.statuses.length > 0 && run.statuses.every((status) => status === 'PASSED');
    const failedStatus = run.statuses.find((status) => status !== 'PASSED') ?? 'NO_STEPS';
    if (!results.has(key)) results.set(key, []);
    results.get(key).push(passed ? 'PASSED' : failedStatus);
  }
}

// --- 4. The verdict per requirement ------------------------------------------------------------

console.log(`Traceability check — layers: ${layers.join(', ')} — reports: ${reportFiles.join(', ') || 'none'}\n`);

let implemented = 0;
for (const req of [...rules.keys()].sort()) {
  const own = scenarios.filter((scenario) => scenario.reqs.includes(req));
  if (pending.has(req)) {
    console.log(`PENDING  ${req}  ${own.length} scenario(s) not required yet`);
    continue;
  }
  implemented += 1;
  let passedScenarios = 0;
  const problems = [];
  const perLayer = {};
  for (const scenario of own) {
    const layer = scenario.layers[0];
    if (!layers.includes(layer)) continue;
    const runs = results.get(`${scenario.file}|${scenario.name}`) ?? [];
    perLayer[layer] ??= { passed: 0, total: 0 };
    perLayer[layer].total += 1;
    if (runs.length === 0) {
      problems.push(`no run found for @${layer} scenario "${scenario.name}"`);
    } else if (runs.every((status) => status === 'PASSED')) {
      passedScenarios += 1;
      perLayer[layer].passed += 1;
    } else {
      problems.push(`@${layer} scenario "${scenario.name}" did not pass: ${runs.join(', ')}`);
    }
  }
  if (passedScenarios === 0 && problems.length === 0) problems.push('no passing scenario in the selected layers');
  const summary = Object.entries(perLayer)
    .map(([layer, count]) => `${layer} ${count.passed}/${count.total}`)
    .join(', ');
  console.log(`${problems.length === 0 ? 'OK     ' : 'FAIL   '}  ${req}  ${summary}`);
  for (const problem of problems) errors.push(`${req}: ${problem}`);
}

console.log(`\n${rules.size} requirements: ${implemented} implemented, ${pending.size} pending. ${scenarios.length} scenarios in the spec.`);

if (errors.length > 0) {
  console.log(`\nTRACE-CHECK FAILED (${errors.length})`);
  for (const error of errors) console.log(`  - ${error}`);
  process.exit(1);
}
console.log('\nTRACE-CHECK PASSED');
