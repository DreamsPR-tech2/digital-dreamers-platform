/* Big 5 for All (Head Start) · LVBD Screening Checklist, Tier I · ELOF-aligned.
 * Instructional screening, not diagnostic: observational, strengths-based, oral-first. The language of a response
 * is recorded but never scored, and neither are volume or posture.
 *
 * Note on names: "Big 5" here always means these five domains. The five We Help! lesson words
 * (help, do, see, go, stop) are called the "Power Words" in the platform.
 */
import type { Child } from './children.ts';

export type B5Status = 'obs' | 'emg' | 'not' | 'nop';
export type DomainId = 'bk' | 'ol' | 'pa' | 'ak' | 'cp';
export interface Indicator { id: string; text: string }
export interface Domain { id: DomainId; name: string; es: string; color: string; elof: string; ind: Indicator[] }

export const BIG5: Domain[] = [
  { id: 'bk', name: 'Background Knowledge', es: 'Conocimiento previo', color: '#2E86D1', elof: 'P-ATL 1 · P-SE 3 · P-LC 1', ind: [
    { id: 'bk1', text: 'Responds to their name and the daily greeting' },
    { id: 'bk2', text: 'Names or points to helpers or friends at school and in the community' },
    { id: 'bk3', text: 'Connects the story to their own life (“me too”, points to something of theirs)' },
    { id: 'bk4', text: 'Follows the daily routine with the visual schedule' }] },
  { id: 'ol', name: 'Oral Language & Vocabulary', es: 'Lenguaje oral y vocabulario', color: '#E63946', elof: 'P-LC 1 · P-LC 2 · P-LC 5 · P-LC 6', ind: [
    { id: 'ol1', text: 'Understands a two-step direction' },
    { id: 'ol2', text: 'Uses 2–3 word phrases in any language or mode' },
    { id: 'ol3', text: 'Shows or names the unit’s key words' },
    { id: 'ol4', text: 'Asks or answers a question about the story' }] },
  { id: 'pa', name: 'Phonological Awareness', es: 'Conciencia fonológica', color: '#B8780A', elof: 'P-LIT 1', ind: [
    { id: 'pa1', text: 'Claps the syllables of names and words' },
    { id: 'pa2', text: 'Recognises two rhyming words' },
    { id: 'pa3', text: 'Isolates the initial sound of a word' },
    { id: 'pa4', text: 'Joins in sound games, songs and chants' }] },
  { id: 'ak', name: 'Alphabet Knowledge & Early Writing', es: 'Conocimiento del alfabeto', color: '#1FA594', elof: 'P-LIT 4 · P-LIT 5 · P-LIT 6', ind: [
    { id: 'ak1', text: 'Recognises the first letter of their name' },
    { id: 'ak2', text: 'Names or points to three or more letters' },
    { id: 'ak3', text: 'Links a letter to its sound' },
    { id: 'ak4', text: 'Makes marks, strokes or letters to write' }] },
  { id: 'cp', name: 'Comprehension & Print Concepts', es: 'Comprensión y lo impreso', color: '#7A4FBF', elof: 'P-LIT 2 · P-LIT 3', ind: [
    { id: 'cp1', text: 'Holds the book and turns pages front to back' },
    { id: 'cp2', text: 'Points to where to read (text, not picture)' },
    { id: 'cp3', text: 'Answers who or what about the story (any mode)' },
    { id: 'cp4', text: 'Retells or orders First · Next · Last with pictures' }] },
];
export const DOMAIN = Object.fromEntries(BIG5.map(d => [d.id, d])) as Record<DomainId, Domain>;
export const domainOf = (indId: string) => DOMAIN[indId.slice(0, 2) as DomainId];
export const INDICATOR = Object.fromEntries(BIG5.flatMap(d => d.ind.map(i => [i.id, i]))) as Record<string, Indicator>;

export const STATUS_LABEL: Record<B5Status, string> = { obs: 'Observed', emg: 'Emerging', not: 'Not yet', nop: 'No chance to observe' };
export const STATUS_ICON: Record<B5Status, string> = { obs: '✓', emg: '◐', not: '○', nop: '—' };
export const LEVELS = ['Beginning', 'Developing', 'Proficient', 'Advanced'] as const;
export const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec'];

/* ---------- how the We Help! lesson becomes Big 5 evidence ---------- */
/** One observation per board box (tap ✓ ◐ ○ on the class panel while the box is up). `b5: null` = outside the Big 5. */
/** `question`: what the screener answers for each child while that part is on (By part, in Assess). */
export const BOX_OBS: Record<string, { label: string; question: string; b5: string | null; short: string }> = {
  intro: { label: 'Answers at “Who is here?”', question: 'Did they respond to “Who is here?”', b5: 'bk1', short: 'Here' },
  today: { label: 'Follows the plan on the board', question: 'Did they follow the plan on the board?', b5: 'bk4', short: 'Plan' },
  ready: { label: 'Gets their body ready with the Brain Break', question: 'Did they get their body ready with the Brain Break?', b5: null, short: 'Ready' },
  move:  { label: 'Names who helps at the place', question: 'Did they name who helps at the place?', b5: 'bk2', short: 'Helper' },
  wall:  { label: 'Shows or says the Power Words', question: 'Did they show or say the Power Words?', b5: 'ol3', short: 'Words' },
  pep:   { label: 'Links H, D, S, G to their sounds', question: 'Did they link each letter to its sound?', b5: 'ak3', short: 'Letters' },
  read:  { label: 'Answers who or what about the reader', question: 'Did they answer who or what about the reader?', b5: 'cp3', short: 'Reader' },
  comp:  { label: 'Puts the story pictures in order', question: 'Did they put the story pictures in order?', b5: 'cp4', short: 'Order' },
};
/** Primary screen (9-point screen) items → Big 5 indicators. Keys are the stored fields:
 * a1 = item 3 receptive vocabulary (0–5), a2 = item 4 expressive (0–1), a3 = item 5 two-step direction (0–1),
 * a4 = item 6 target sound (0–1), a5 = item 7 anchor sentence (0–1), bonus = item 8 (not scored). */
export const QC_B5: Record<string, string> = { a1: 'ol3', a2: 'ol2', a3: 'ol1', a4: 'pa3', a5: 'ol2', bonus: 'ol2' };
export const QC_ITEM: Record<string, number> = { a1: 3, a2: 4, a3: 5, a4: 6, a5: 7, bonus: 8 };
export const OBS_TO_B5: Record<string, B5Status> = { ok: 'obs', sup: 'emg', no: 'not' };
/** One primary-screen score → Big 5 status. Item 3: all 5 words observed, 3–4 emerging. Items 4–7: 1 point is
 * observed, or emerging when the screener recorded that it needed a prompt or a model. */
export function scoreToB5(k: string, v: number, support?: unknown): B5Status {
  if (k === 'a1' || k === 'r1') return v >= 5 ? 'obs' : v >= 3 ? 'emg' : 'not';
  return v >= 1 ? (support === 'prompt' || support === 'model' ? 'emg' : 'obs') : 'not';
}
export const BONUS_B5: Record<string, B5Status> = { Completed: 'obs', Attempted: 'emg' };
/** Full marks on one item (item 3: all 5 words; items 4–7: 1 point). */
export const fullMarks = (k: string, v: number) => v >= (k === 'a1' ? 5 : 1);
const RANK: Record<B5Status, number> = { nop: 0, not: 1, emg: 2, obs: 3 };

export interface LiveStudent { a1?: number | null; a2?: number | null; a3?: number | null; a4?: number | null; a5?: number | null; bonus?: string | null;
  r1?: number | null; r2?: number | null; r3?: number | null; r4?: number | null; r5?: number | null; obs?: Record<string, string>;
  b5?: Record<string, B5Status> }
const given = (v: unknown): v is number => v !== null && v !== undefined && v !== '';

export interface Evidence { ind: string; status: B5Status; source: string }
/** Big 5 evidence from today's lesson for one student. Strengths-based: the best evidence per indicator wins. */
export function todayEvidence(s: LiveStudent): Record<string, Evidence> {
  const out: Record<string, Evidence> = {};
  const add = (ind: string, status: B5Status, source: string) => {
    const cur = out[ind]; if (!cur || RANK[status] > RANK[cur.status]) out[ind] = { ind, status, source };
  };
  for (const [box, v] of Object.entries(s.obs || {})) { const m = BOX_OBS[box]; if (m?.b5 && OBS_TO_B5[v]) add(m.b5, OBS_TO_B5[v], `Box · ${m.short}`); }
  const x = s as Record<string, unknown>;
  for (const [k, ind] of Object.entries(QC_B5)) {
    if (k === 'bonus') { const b = BONUS_B5[String(x.bonus)]; if (b) add(ind, b, 'Primary screen · item 8 bonus'); continue; }
    const rk = 'r' + k.slice(1), re = x[rk], useRe = given(re) && x[rk + '_status'] !== 'not_administered';
    const v = useRe ? re : x[k];
    if (given(v) && x[(useRe ? rk : k) + '_status'] !== 'not_administered')
      add(ind, scoreToB5(k, v, x[(useRe ? rk : k) + '_support']), `Primary screen · item ${QC_ITEM[k]}${useRe ? ' (2nd screen)' : ''}`);
  }
  // the teacher's own checklist mark (child record → Big 5) always wins over automatic evidence
  for (const [ind, st] of Object.entries(s.b5 || {})) if (INDICATOR[ind] && st) out[ind] = { ind, status: st, source: 'Teacher observation' };
  return out;
}

const pts: Record<B5Status, number | null> = { obs: 100, emg: 50, not: 0, nop: null };
function avg(xs: (number | null)[]) { const v = xs.filter((x): x is number => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; }
export const levelOf = (score: number | null) => (score === null ? null : score < 35 ? 0 : score < 60 ? 1 : score < 85 ? 2 : 3);

/** Checklist status now: September checkpoint, overwritten by today's evidence where there is some. */
export function currentStatus(child: Child | null, ev: Record<string, Evidence>): Record<string, B5Status> {
  const out: Record<string, B5Status> = {};
  for (const d of BIG5) for (const i of d.ind) out[i.id] = ev[i.id]?.status ?? child?.b5Sept[i.id] ?? 'nop';
  return out;
}
/** 0–100 for one domain from today's evidence only (null if none). */
export function todayDomainScore(ev: Record<string, Evidence>, dom: DomainId) {
  return avg(DOMAIN[dom].ind.map(i => (ev[i.id] ? pts[ev[i.id].status] : null)));
}
/** Monthly composite per domain: Sep–Nov from history, Dec = Nov moved 40% toward today's evidence. */
export function series(child: Child | null, ev: Record<string, Evidence>, dom: DomainId): (number | null)[] {
  const hist = child ? child.months[dom] : [null, null, null];
  const t = todayDomainScore(ev, dom), nov = hist[2];
  const dec = t === null ? null : nov === null ? t : Math.round(0.6 * nov + 0.4 * t);
  return [...hist, dec];
}
export function domainScore(child: Child | null, ev: Record<string, Evidence>, dom: DomainId) {
  const s = series(child, ev, dom); return s[3] ?? s[2] ?? s[1] ?? s[0] ?? null;
}
export function composite(child: Child | null, ev: Record<string, Evidence>) { return avg(BIG5.map(d => domainScore(child, ev, d.id))); }

/** Today's independence: share of box observations marked ✓ and primary screen items with full marks. */
export function todayIndependence(s: LiveStudent): number | null {
  let ok = 0, n = 0;
  for (const v of Object.values(s.obs || {})) { n++; if (v === 'ok') ok++; }
  for (const k of ['a1', 'a2', 'a3', 'a4', 'a5'] as const) { const v = s[k]; if (given(v)) { n++; if (fullMarks(k, v)) ok++; } }
  return n ? Math.round((ok / n) * 100) : null;
}

/* Group standard (unchanged from the Nov 10 demo): readiness = 70% Big 5 composite + 30% last-4-lesson independence.
 * Advanced ≥ 68 · Progressing 45–67 · Beginning < 45. */
export const GRP_ADV = 68, GRP_BEG = 45;
export type Group = 'beg' | 'pro' | 'adv';
export const GROUP_LABEL: Record<Group, string> = { beg: 'Beginning', pro: 'Progressing', adv: 'Advanced' };
export function lastFour(child: Child | null, s: LiveStudent): number[] {
  const past = (child?.lessons || []).filter((x): x is number => x !== null);
  const t = todayIndependence(s);
  return (t === null ? past : [...past, t]).slice(-4);
}
export function readiness(child: Child | null, s: LiveStudent) {
  const ev = todayEvidence(s), c = composite(child, ev), l = lastFour(child, s);
  if (c === null) return null;
  const li = l.length ? l.reduce((a, b) => a + b, 0) / l.length : c;
  return Math.round(0.7 * c + 0.3 * li);
}
export const groupOf = (score: number | null): Group | null => (score === null ? null : score >= GRP_ADV ? 'adv' : score < GRP_BEG ? 'beg' : 'pro');
