// Claude Code PreToolUse hook: stops an agent's edit to tests/ or src/ before it is written when the edit
//   - leaves fewer assertions than there were (expect(...) or a page object's expect*()),
//   - adds a skip, fixme, only or fail annotation, a fixed wait, force: true, or switches off a Playwright lint rule.
// Exit code 2 blocks the edit and shows the message to the agent. scripts/guard-assertions.ts repeats the check in CI,
// where a person can approve a real rule change with a "rule-change:" commit note.
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const tool = input.tool_name;
const args = input.tool_input ?? {};
const file = args.file_path ?? '';
const rel = relative(process.cwd(), file).replaceAll('\\', '/');
if (!/^(tests|src)\/.*\.ts$/.test(rel)) process.exit(0);

const ASSERTION = /\bexpect(\.soft|\.poll)?\(|\.expect[A-Z]\w*\(/g;
const BANNED = [
  [/\btest(\.describe)?\.(skip|fixme|only|fail)\(/, 'a skip, fixme, only or fail annotation'],
  [/\.waitForTimeout\(/, 'a fixed wait (waitForTimeout)'],
  [/force:\s*true/, 'force: true'],
  [/eslint-disable(-next-line|-line)?[^\n]*playwright\//, 'an eslint-disable for a Playwright rule'],
];
const count = (text) => (text.match(ASSERTION) ?? []).length;

// Before and after, as text: the replaced fragments for Edit/MultiEdit, the whole file for Write.
let before = '';
let after = '';
if (tool === 'Write') {
  before = existsSync(file) ? readFileSync(file, 'utf8') : '';
  after = args.content ?? '';
} else {
  const edits = tool === 'MultiEdit' ? (args.edits ?? []) : [args];
  for (const e of edits) {
    before += `${e.old_string ?? ''}\n`;
    after += `${e.new_string ?? ''}\n`;
  }
}

const problems = [];
if (count(after) < count(before)) {
  problems.push(
    `it removes ${count(before) - count(after)} assertion(s). Never weaken or remove an assertion to make a test ` +
      'pass. If the test is right and the app is wrong, report a suspected bug. If the business rule changed, ' +
      'stop and ask the person you are working with.',
  );
}
for (const [pattern, what] of BANNED) {
  if (pattern.test(after) && !pattern.test(before)) problems.push(`it adds ${what}, which this suite does not allow.`);
}

if (problems.length) {
  console.error(`Blocked edit to ${rel}:\n- ${problems.join('\n- ')}\nSee CLAUDE.md, "Assertions are sacred".`);
  process.exit(2);
}
