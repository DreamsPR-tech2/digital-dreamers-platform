// Run: npm test  (Node 22: node --experimental-strip-types --test)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { CHILDREN, childByName } from '../lib/children.ts';
import { BIG5, todayEvidence, readiness, groupOf, series, todayIndependence } from '../lib/big5.ts';
import { generatePlan, nextSchoolDay } from '../lib/plan.ts';
import { fillAll } from '../lib/sample.ts';

const require = createRequire(import.meta.url);
const S = require('../lib/wehelp/scoring.js');

const CONTENT = {
  boxes: ['intro', 'today', 'ready', 'move', 'wall', 'pep', 'read', 'comp'].map((id, i) => ({ id, n: i + 1, title: id })),
  words: ['help', 'do', 'see', 'go', 'stop'].map(en => ({ en, es: en })),
  letters: [{ L: 'H', word: 'help' }, { L: 'D', word: 'do' }, { L: 'S', word: 'see' }, { L: 'G', word: 'go' }],
  brainBreaks: [{ id: 'fivefinger', en: 'Five-Finger Breathing' }, { id: 'calm', en: 'Calm Breathing' }],
  sequenceCount: { 1: 2, 2: 3, 3: 5 },
};
function sampleLesson() {
  const d: any = { students: CHILDREN.map((c, i) => ({ id: 'id' + i, no: i + 1, name: c.name, a1_missed: [], zero_notes: {}, stop: [] })),
    stop: { watched: [], turn: 1, turns: 5 }, levelLog: [], activity: { brainBreaks: [], draws: [], stops: [] } };
  fillAll(d, '2026-12-01T15:00:00.000Z');
  return d;
}
const rec = (s: any) => ({ ...s, stop_yes: (s.stop || []).filter((v: string) => v === 'Y').length, stop_no: (s.stop || []).filter((v: string) => v === 'N').length });

test('8 fictional children, none from the earlier rosters', () => {
  assert.equal(CHILDREN.length, 8);
  const old = ['Valentina', 'Liam', 'María', 'Mateo', 'Lucas', 'Noah', 'Sebastián', 'Emma', 'Sofia', 'Isabella', 'Diego', 'Camila', 'Amaya', 'Adrián', 'Gabriela', 'Jomar', 'Kiara', 'Luis', 'Valeria'];
  CHILDREN.forEach(c => assert.ok(!old.includes(c.name), c.name));
  CHILDREN.forEach(c => assert.equal(Object.keys(c.b5Sept).length, 20, c.name));
  assert.equal(childByName('joaquin')?.id, 'joaquin'); // accents don't matter for matching
});

test('Quick Check and box observations become Big 5 evidence', () => {
  const ev = todayEvidence({ a1: 3, a3: 1, a4: 2, obs: { pep: 'sup', comp: 'ok', ready: 'ok' } });
  assert.equal(ev.ol3.status, 'obs');   // item 1, all five words
  assert.equal(ev.ol1.status, 'not');   // item 3, two-step direction
  assert.equal(ev.pa3.status, 'emg');   // item 4, /h/
  assert.equal(ev.ak3.status, 'emg');   // letters box with support
  assert.equal(ev.cp4.status, 'obs');   // sequencing box
  assert.equal(Object.values(ev).some(e => e.source.includes('Ready')), false); // Brain Break is outside the Big 5
  // second screen replaces the start score for that item
  assert.equal(todayEvidence({ a4: 1, r4: 3 }).pa3.status, 'obs');
  // the best evidence wins (strengths-based): word wall ✓ beats item 1 = 1
  assert.equal(todayEvidence({ a1: 1, obs: { wall: 'ok' } }).ol3.status, 'obs');
});

test('readiness keeps the 70/30 group standard; no evidence and no profile means no group', () => {
  assert.equal(readiness(null, {}), null);
  assert.equal(groupOf(68), 'adv'); assert.equal(groupOf(67), 'pro'); assert.equal(groupOf(45), 'pro'); assert.equal(groupOf(44), 'beg');
  const z = childByName('Zoe')!, l = childByName('Luna')!;
  assert.equal(groupOf(readiness(z, {})), 'adv');
  assert.equal(groupOf(readiness(l, {})), 'beg');
  assert.equal(todayIndependence({ a1: 3, a2: 2, obs: { wall: 'ok', pep: 'no' } }), 50);
  assert.equal(series(childByName('Elías'), {}, 'ol')[0], null); // joined in October
});

test('sample lesson scores match the toolkit rules', () => {
  const d = sampleLesson(), sm = S.classSummary(d.students.map(rec));
  assert.equal(sm.screened, 8);
  assert.equal(sm.class_level, 2);
  assert.deepEqual(sm.level_counts, { 1: 1, 2: 5, 3: 2 });
  const joaquin = S.student(rec(d.students[1]));
  assert.deepEqual(joaquin.flagged_items, [2, 4]);
  assert.equal(joaquin.end_total, 10);
  assert.ok(sm.stop_percent! > 50);
});

test('tomorrow’s plan explains every change and presets the board', () => {
  const d = sampleLesson(), recs = d.students.map(rec), sm = S.classSummary(recs);
  const P = generatePlan({ students: d.students, results: sm.students, summary: sm, brainBreaksUsed: ['fivefinger'], content: CONTENT, date: '2026-12-01' });
  assert.equal(P.date, '2026-12-02');
  assert.equal(P.board.level, 2);
  assert.equal(P.board.word, 1);                 // DO is the most-missed Power Word
  assert.equal(P.board.letter, 0);               // /h/ sound game → start on H
  for (const lines of Object.values(P.boxes)) for (const l of lines) if (l.kind !== 'same') assert.ok(l.why, `no reason for: ${l.text}`);
  assert.ok(P.boxes.wall.some(l => l.kind === 'chg' && /DO \(5\)/.test(l.text)));
  assert.ok(P.boxes.comp.some(l => /Second screen still open/.test(l.text)));
  assert.ok(P.focus && BIG5.some(b => b.id === P.focus!.dom));
  assert.equal(Object.values(P.groups).flat().length, 8);
});

test('next school day skips the weekend', () => {
  assert.equal(nextSchoolDay('2026-12-04'), '2026-12-07');
});
