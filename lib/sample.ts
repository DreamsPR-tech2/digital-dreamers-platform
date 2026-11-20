/* Sample lesson responses for the 8 fictional children, for demos only.
 * Fills one board box at a time (so the class panel can be shown filling in live) or the whole lesson.
 * Only children with a fictional profile are touched; the UI offers this only while the demo roster is loaded.
 */
import { childByName } from './children.ts';
import type { Obs } from './runtime.tsx';

type S = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/* per child: box observations, Quick Check (a1..a5, missed words, bonus, mode, engaged), second screen, stop marks */
const SAMPLE: Record<string, { obs: Record<string, Obs>; qc: [number, number, number, number, number]; missed: string[]; bonus?: number;
  mode: string; engaged: boolean; note?: string; zero?: Record<string, string>; re?: Record<string, number>; stop?: ('Y' | 'N')[]; help?: string[] }> = {
  natalia: { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'ok', wall: 'ok', pep: 'sup', read: 'ok', comp: 'ok' }, qc: [3, 3, 3, 2, 3], missed: [], bonus: 3, mode: 'Spanish', engaged: true },
  joaquin: { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'sup', wall: 'sup', pep: 'no', read: 'sup', comp: 'ok' }, qc: [2, 1, 2, 1, 2], missed: ['do', 'see'], mode: 'AAC', engaged: true,
    re: { r2: 2, r4: 2 }, stop: ['Y', 'Y', 'N', 'Y', 'Y'], help: ['help_asked'] },
  zoe:     { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'ok', wall: 'ok', pep: 'ok', read: 'ok', comp: 'sup' }, qc: [3, 3, 3, 3, 2], missed: [], bonus: 2, mode: 'speech', engaged: true },
  mason:   { obs: { intro: 'ok', today: 'sup', ready: 'sup', move: 'ok', wall: 'ok', pep: 'sup', read: 'sup', comp: 'sup' }, qc: [3, 2, 1, 2, 2], missed: [], mode: 'speech', engaged: true,
    stop: ['N', 'Y', 'N', 'N', 'Y'], help: ['help_offered'] },
  luna:    { obs: { intro: 'ok', today: 'sup', ready: 'sup', move: 'sup', wall: 'sup', pep: 'no', read: 'no', comp: 'sup' }, qc: [1, 1, 1, 0, 1], missed: ['do', 'see', 'go'], mode: 'sign', engaged: true,
    zero: { a4: 'Did not seem to understand' }, stop: ['Y', 'Y', 'Y', 'N', 'Y'], help: ['support'] },
  thiago:  { obs: { intro: 'ok', today: 'ok', ready: 'no', move: 'sup', wall: 'ok', pep: 'ok', read: 'sup', comp: 'no' }, qc: [2, 2, 2, 1, 1], missed: ['do'], mode: 'pointing', engaged: false,
    note: 'Needed headphones during the game; engaged again after Calm Breathing', stop: ['N', 'N', 'Y', 'N', 'N'], help: ['support'] },
  elias:   { obs: { intro: 'sup', today: 'ok', ready: 'ok', move: 'ok', wall: 'sup', pep: 'ok', read: 'ok', comp: 'ok' }, qc: [2, 1, 2, 2, 1], missed: ['see', 'do'], mode: 'speech', engaged: true },
  aurora:  { obs: { intro: 'ok', today: 'ok', ready: 'ok', move: 'no', wall: 'sup', pep: 'sup', read: 'sup', comp: 'sup' }, qc: [1, 1, 2, 1, 1], missed: ['do', 'see', 'go'], mode: 'Spanish', engaged: true,
    stop: ['Y', 'Y', 'Y', 'Y', 'N'], help: ['help_asked'] },
};
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
    p.qc.forEach((v, i) => (s['a' + (i + 1)] = v));
    s.a1_missed = p.missed.slice(); s.zero_notes = { ...(p.zero || {}) }; s.bonus = p.bonus ?? null;
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
