// The assertion guard: fails when a change makes the suite check less, whoever made it (a person, the Generator or
// the Healer). Lint catches banned code; this catches banned *changes*, which lint can't see.
//
//   npm run guard                     compares the working tree with main
//   GUARD_BASE=origin/main npm run guard   (CI: the pull request's base)
//
// It fails on:
//   - an assertion line removed without the same line added back (expect(...), or a page object's expect*()),
//   - a skip, fixme, only or fail annotation added,
//   - a fixed wait or force: true added,
//   - an eslint-disable added for a playwright/* rule.
// Removing or changing an assertion is sometimes right, when the business rule changed. Then a commit in the range
// must say so: a line starting "rule-change:" with the rule id and the reason. Annotations and waits have no escape.
import { execFileSync } from 'node:child_process';

const base = process.env.GUARD_BASE ?? 'main';
const PATHS = ['tests', 'src'];

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const ASSERTION = /\bexpect(\.soft|\.poll)?\(|\.expect[A-Z]\w*\(/;
const BANNED: [RegExp, string][] = [
  [/\btest(\.describe)?\.(skip|fixme|only|fail)\(/, 'adds a skip, fixme, only or fail annotation'],
  [/\.waitForTimeout\(/, 'adds a fixed wait'],
  [/force:\s*true/, 'adds force: true'],
  [/eslint-disable(-next-line|-line)?[^\n]*playwright\//, 'switches off a Playwright lint rule'],
];

type Line = { file: string; text: string };

function diffLines(): { added: Line[]; removed: Line[] } {
  // base...HEAD for committed changes, plus anything not yet committed.
  const committed = git('diff', '--unified=0', '--no-color', `${base}...HEAD`, '--', ...PATHS);
  const uncommitted = git('diff', '--unified=0', '--no-color', 'HEAD', '--', ...PATHS);
  const added: Line[] = [];
  const removed: Line[] = [];
  let file = '';
  for (const raw of `${committed}\n${uncommitted}`.split('\n')) {
    if (raw.startsWith('+++ ')) file = raw.replace(/^\+\+\+ (b\/)?/, '');
    else if (raw.startsWith('--- ')) continue;
    else if (raw.startsWith('+')) added.push({ file, text: raw.slice(1).trim() });
    else if (raw.startsWith('-')) removed.push({ file, text: raw.slice(1).trim() });
  }
  return { added, removed };
}

function ruleChangeNotes(): string[] {
  const log = git('log', '--format=%B', `${base}..HEAD`);
  return log.split('\n').filter((l) => /^rule-change:\s*\S/i.test(l.trim()));
}

const { added, removed } = diffLines();
const addedTexts = new Set(added.map((l) => l.text));
const problems: string[] = [];

const lostAssertions = removed.filter((l) => ASSERTION.test(l.text) && !addedTexts.has(l.text));
const notes = ruleChangeNotes();
if (lostAssertions.length && notes.length === 0) {
  for (const l of lostAssertions) problems.push(`${l.file}: removes or changes an assertion: ${l.text}`);
  problems.push(
    'If a business rule really changed, add a commit message line "rule-change: <rule id> <why>" and update ' +
      'the rule in specs/<feature>/rules.md. Never change an assertion only to make a test pass.',
  );
}

for (const l of added) {
  for (const [pattern, what] of BANNED) {
    if (pattern.test(l.text)) problems.push(`${l.file}: ${what}: ${l.text}`);
  }
}

if (problems.length) {
  console.error(`Assertion guard: ${problems.length} problem(s) against ${base}\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const allowed = lostAssertions.length ? ` (${lostAssertions.length} assertion change(s) covered by rule-change notes)` : '';
console.log(`Assertion guard: OK against ${base}${allowed}.`);
