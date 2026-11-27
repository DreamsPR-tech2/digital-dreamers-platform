/* Sample lesson responses for the 8 fictional children, for demos only.
 * Fills one board box at a time (so the class panel can be shown filling in live) or the whole lesson.
 * Only children with a fictional profile are touched; the UI offers this only while the demo roster is loaded.
 */
import { childByName } from './children.ts';
import type { Obs } from './runtime.tsx';

type S = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/* per child: box observations; primary screen (9-point: item 3 words shown, item 4 how many words + support, item 5 steps,
 * item 6 sound, item 7 words of "We help." + support), bonus, mode, engaged; second screen; stop marks */
type QC = { words: string[]; count: number; sup4?: string; steps: [number, boolean]; sup5?: string; sound: boolean; anchor: number; sup7?: string };
const SAMPLE: Record<string, { obs: Record<string, Obs>; qc: QC; bonus?: string;
  mode: string; engaged: boolean; note?: string; zero?: Record<string, string>; re?: Record<string, unknown>; stop?: ('Y' | 'N')[]; help?: string[] }> = {
  natalia: { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'ok', wall: 'ok', pep: 'sup', read: 'ok', comp: 'ok' },
    qc: { words: ['help', 'do', 'see', 'go', 'stop'], count: 5, steps: [2, true], sound: true, anchor: 2 }, bonus: 'Completed', mode: 'Spanish', engaged: true },
  joaquin: { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'sup', wall: 'sup', pep: 'no', read: 'sup', comp: 'ok' },
    qc: { words: ['help', 'go', 'stop'], count: 2, sup4: 'model', steps: [2, true], sup5: 'prompt', sound: false, anchor: 2, sup7: 'prompt' }, mode: 'AAC', engaged: true,
    re: { r2: 1, r2_status: 'correct', r2_count: 4, r4: 1, r4_status: 'correct', r4_sound: true }, stop: ['Y', 'Y', 'N', 'Y', 'Y'], help: ['help_asked'] },
  zoe:     { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'ok', wall: 'ok', pep: 'ok', read: 'ok', comp: 'sup' },
    qc: { words: ['help', 'do', 'see', 'go', 'stop'], count: 5, steps: [2, true], sound: true, anchor: 1 }, bonus: 'Attempted', mode: 'speech', engaged: true },
  mason:   { obs: { intro: 'ok', today: 'sup', ready: 'sup', move: 'ok', wall: 'ok', pep: 'sup', read: 'sup', comp: 'sup' },
    qc: { words: ['help', 'do', 'see', 'go', 'stop'], count: 4, steps: [1, true], sup5: 'prompt', sound: false, anchor: 1 }, mode: 'speech', engaged: true,
    stop: ['N', 'Y', 'N', 'N', 'Y'], help: ['help_offered'] },
  luna:    { obs: { intro: 'ok', today: 'sup', ready: 'sup', move: 'sup', wall: 'sup', pep: 'no', read: 'no', comp: 'sup' },
    qc: { words: ['help'], count: 1, sup4: 'model', steps: [1, true], sup5: 'model', sound: false, anchor: 2, sup7: 'model' }, mode: 'sign', engaged: true,
    zero: { a4: 'Did not seem to understand' }, stop: ['Y', 'Y', 'Y', 'N', 'Y'], help: ['support'] },
  thiago:  { obs: { intro: 'ok', today: 'ok', ready: 'no', move: 'sup', wall: 'ok', pep: 'ok', read: 'sup', comp: 'no' },
    qc: { words: ['help', 'see', 'go', 'stop'], count: 3, steps: [2, false], sound: false, anchor: 1 }, mode: 'pointing', engaged: false,
    note: 'Needed headphones during the game; engaged again after Calm Breathing', stop: ['N', 'N', 'Y', 'N', 'N'], help: ['support'] },
  elias:   { obs: { intro: 'sup', today: 'ok', ready: 'ok', move: 'ok', wall: 'sup', pep: 'ok', read: 'ok', comp: 'ok' },
    qc: { words: ['help', 'go', 'stop'], count: 3, sup4: 'prompt', steps: [2, true], sound: true, anchor: 1 }, mode: 'speech', engaged: true },
  aurora:  { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'no', wall: 'sup', pep: 'sup', read: 'sup', comp: 'sup' },
    qc: { words: ['help', 'stop'], count: 2, steps: [2, true], sound: false, anchor: 2 }, mode: 'Spanish', engaged: true,
    stop: ['Y', 'Y', 'Y', 'Y', 'N'], help: ['help_asked'] },
};
/** Writes one sample primary screen in the same fields the Assess screen records (score + status per item). */
function writeQC(s: S, q: QC, mode: string) {
  const st = (v: number) => (v > 0 ? 'correct' : 'attempted');
  s.a1_words = q.words.slice(); s.a1_done = true; s.a1 = q.words.length; s.a1_status = st(s.a1);
  s.a2_count = q.count; s.a2_mode = mode; s.a2_support = q.sup4 || 'independent'; s.a2 = q.count >= 3 ? 1 : 0; s.a2_status = st(s.a2);
  s.a3_steps = q.steps[0]; s.a3_in_order = q.steps[0] === 2 ? q.steps[1] : null; s.a3_support = q.sup5 || 'independent';
  s.a3 = q.steps[0] === 2 && q.steps[1] ? 1 : 0; s.a3_status = st(s.a3);
  s.a4_sound = q.sound; s.a4 = q.sound ? 1 : 0; s.a4_status = st(s.a4);
  s.a5_anchor = q.anchor; s.a5_mode = mode; s.a5_support = q.sup7 || 'independent'; s.a5 = q.anchor === 2 ? 1 : 0; s.a5_status = st(s.a5);
}
const STOP_WATCH = ['joaquin', 'mason', 'luna', 'thiago', 'aurora'];

const pid = (s: S) => childByName(s.name)?.id || '';
const at = (base: number, mins: number) => new Date(base + mins * 60000).toISOString();

export function fillBox(d: S, box: string, nowISO: string) {
  const t0 = Date.parse(nowISO) - 40 * 60000;
  for (const s of d.students as S[]) {
    const p = SAMPLE[pid(s)]; if (!p) continue;
    if (box === 'intro' && s.present === undefined) { s.present = true; s.present_at = at(t0, 1); }
    if (s.present === false) continue;
    if (!s.obs?.[box]) s.obs = { ...(s.obs || {}), [box]: p.obs[box] }; // never overwrite what a teacher recorded
  }
  if (box === 'ready' && !d.activity.brainBreaks.length) d.activity.brainBreaks.push({ id: 'fivefinger', at: at(t0, 6), by: 'Sample' });
  if (box === 'move') fillStops(d, t0);
}
function fillStops(d: S, t0: number) {
  const places = ['school', 'mall', 'fort', 'firehouse', 'school'];
  if (!d.activity.draws.length) places.forEach((pl, i) => {
    d.activity.draws.push({ place: pl, at: at(t0, 9 + i * 2), by: 'Sample', how: 'spin' });
    d.activity.stops.push({ n: i + 1, place: pl, at: at(t0, 10 + i * 2), by: 'Sample' });
  });
  d.stop.turns = Math.max(d.stop.turns, 5); d.stop.turn = 5;
  for (const s of d.students as S[]) {
    const id = pid(s), p = SAMPLE[id]; if (!p || !STOP_WATCH.includes(id)) continue;
    if (!d.stop.watched.includes(s.id)) d.stop.watched.push(s.id);
    if ((s.stop || []).some(Boolean)) continue; // already marked by the teacher
    s.stop = (p.stop || []).slice(); (p.help || []).forEach(h => (s[h] = at(t0, 14))); s.game_engaged = p.engaged;
  }
}
export function fillQuickCheck(d: S, nowISO: string, withSecond = true) {
  const t0 = Date.parse(nowISO) - 35 * 60000; let k = 0;
  for (const s of d.students as S[]) {
    const p = SAMPLE[pid(s)]; if (!p || s.present === false) continue;
    if (['a1', 'a2', 'a3', 'a4', 'a5'].some(k => s[k] !== null && s[k] !== undefined)) continue; // already (partly) screened
    writeQC(s, p.qc, p.mode);
    s.zero_notes = { ...(p.zero || {}) }; s.bonus = p.bonus ?? null;
    s.response_mode = p.mode; s.engaged = p.engaged; s.engagement_note = p.note || '';
    s.started_at = at(t0, k * 3); s.finished_at = at(t0, k * 3 + 2.5); s.screened_by = 'Sample'; k++;
    if (withSecond && p.re) { Object.assign(s, p.re); s.re_started_at = at(t0, 30); }
  }
}
export function fillAll(d: S, nowISO: string) {
  for (const b of ['intro', 'today', 'ready', 'move', 'wall', 'pep', 'read', 'comp']) fillBox(d, b, nowISO);
  fillQuickCheck(d, nowISO);
  if (!d.levelLog.length) d.levelLog.push({ at: nowISO, by: 'Sample', level: 2, recommended: 2, source: 'quick check', reason: '' });
}
export const sampleReady = (d: S) => (d.students as S[]).some(s => SAMPLE[pid(s)]);
