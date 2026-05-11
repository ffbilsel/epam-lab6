#!/usr/bin/env node
/**
 * check-pyramid-distribution.mjs
 *
 * Constitution v1.1.0 / Principle V.2 — enforces the testing-pyramid
 * distribution by counting *test files* per Jest project and asserting that
 * each tier sits within ±10 percentage points of the targets:
 *
 *   unit         ~70%
 *   integration  ~20%
 *   e2e          ~10%
 *
 * Exits 0 on conformance, 1 otherwise. Prints a one-line summary on success
 * and a tabular diff on failure.
 *
 * Counts use Jest's own `testMatch` patterns (defined in jest.config.cjs)
 * via `jest --listTests --json` so this script never drifts from the
 * configured test sets.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const TARGETS = { unit: 70, integration: 20, e2e: 10 };
const TOLERANCE_PP = 10;

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, '..');

/**
 * List the test files Jest discovers for one project.
 *
 * @param {'unit'|'integration'|'e2e'} project - the Jest project name.
 * @returns {string[]} absolute paths of test files.
 */
function listTests(project) {
  const out = execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['jest', '--listTests', '--json', '--selectProjects', project],
    { cwd: backendRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  /** @type {string[]} */
  const files = JSON.parse(out);
  return files;
}

const counts = {
  unit: listTests('unit').length,
  integration: listTests('integration').length,
  e2e: listTests('e2e').length,
};
const total = counts.unit + counts.integration + counts.e2e;

if (total === 0) {
  console.error('No tests discovered — cannot evaluate pyramid distribution.');
  process.exit(1);
}

const pct = {
  unit: (counts.unit / total) * 100,
  integration: (counts.integration / total) * 100,
  e2e: (counts.e2e / total) * 100,
};

const violations = [];
for (const tier of ['unit', 'integration', 'e2e']) {
  const target = TARGETS[tier];
  const actual = pct[tier];
  const diff = actual - target;
  if (Math.abs(diff) > TOLERANCE_PP) {
    violations.push({ tier, target, actual, diff, count: counts[tier] });
  }
}

if (violations.length === 0) {
  const fmt = (n) => n.toFixed(1).padStart(4);
  console.log(
    `pyramid OK — unit ${fmt(pct.unit)}% (${counts.unit}) | ` +
      `integration ${fmt(pct.integration)}% (${counts.integration}) | ` +
      `e2e ${fmt(pct.e2e)}% (${counts.e2e}) | total ${total}`,
  );
  process.exit(0);
}

console.error('Testing pyramid distribution out of bounds (Constitution V.2):');
console.error('');
console.error('  tier         target   actual    diff   count');
console.error('  -----------  -------  -------  ------  -----');
for (const v of violations) {
  const sign = v.diff >= 0 ? '+' : '';
  console.error(
    `  ${v.tier.padEnd(11)}  ${(`${v.target}%`).padStart(6)}  ` +
      `${v.actual.toFixed(1).padStart(6)}%  ${sign}${v.diff.toFixed(1).padStart(5)}pp  ${String(
        v.count,
      ).padStart(5)}`,
  );
}
console.error('');
console.error(`tolerance: ±${TOLERANCE_PP} pp (per Constitution V.2)`);
process.exit(1);
