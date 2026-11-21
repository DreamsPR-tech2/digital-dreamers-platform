/* Tomorrow's plan for We Help! day 2, generated from what was recorded today.
 * Every line that differs from today says why, with the number behind it. The teacher can edit any line,
 * save the plan, and apply its board presets (reader level, Brain Break, first word, first letter) to the board.
 * Pure function: no window, so it runs in tests.
 */
import { childByName, type Child } from './children.ts';
import { BIG5, GROUP_LABEL, groupOf, readiness, todayDomainScore, todayEvidence, type DomainId, type Group, type LiveStudent } from './big5.ts';

export type Kind = 'same' | 'chg' | 'new';
export interface PlanLine { text: string; kind: Kind; why?: string }
export interface PlanInput {
  students: (LiveStudent & { id: string; name: string; present?: boolean; a1_missed?: string[]; stop?: ('Y' | 'N' | null)[] })[];
  results: { complete: boolean; start_level: number | null; flags: string[]; flagged_items: number[]; rescreen_needed: boolean; rescreen_done: boolean }[];
  summary: { screened: number; class_level: number | null; level_counts: Record<number, number>; stop_percent: number | null; stop_yes: number; stop_no: number; flag_counts: Record<string, number> };
  brainBreaksUsed: string[];
  content: { boxes: { id: string; n: number; title: string }[]; words: { en: string; es: string }[]; letters: { L: string; word: string }[];
    brainBreaks: { id: string; en: string }[]; sequenceCount: Record<number, number> };
  date: string; // today, YYYY-MM-DD
}
export interface Plan {
  date: string; label: string;
  boxes: Record<string, PlanLine[]>;
  groups: Record<Group, string[]>;
  kid: Record<string, string[]>;
  focus: { dom: DomainId; name: string; score: number } | null;
  family: string;
  board: { level: number | null; bb: string | null; word: number; letter: number };
  basis: string;
}

export function nextSchoolDay(iso: string) {
  const d = new Date(iso + 'T12:00:00'); do d.setDate(d.getDate() + 1); while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().slice(0, 10);
}
const fmtDay = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const names = (xs: { name: string }[], max = 4) => xs.slice(0, max).map(x => x.name).join(', ') + (xs.length > max ? ` +${xs.length - max}` : '');
const notOk = (s: LiveStudent, box: string) => !!s.obs?.[box] && s.obs[box] !== 'ok';

export function generatePlan(inp: PlanInput): Plan {
  const { students, results, summary: sm, content: C } = inp;
  const here = students.filter(s => s.present !== false);
  const P: Plan = { date: nextSchoolDay(inp.date), label: '', boxes: {}, groups: { beg: [], pro: [], adv: [] }, kid: {}, focus: null, family: '',
    board: { level: sm.class_level, bb: null, word: 0, letter: 0 }, basis: '' };
  P.label = fmtDay(P.date);
  C.boxes.forEach(b => (P.boxes[b.id] = []));
  students.forEach(s => (P.kid[s.id] = []));
  const add = (box: string, text: string, kind: Kind = 'same', why?: string) => P.boxes[box].push({ text, kind, why });
  const prof = (s: { name: string }): Child | null => childByName(s.name);
  const res = (s: { id: string }) => results[students.findIndex(x => x.id === s.id)];
  const flagged = (f: string) => students.filter(s => res(s)?.flags.includes(f));

  // groups (readiness) and the Big 5 focus
  students.forEach(s => { const g = groupOf(readiness(prof(s), s)); if (g) P.groups[g].push(s.id); });
  const evs = students.map(s => todayEvidence(s));
  const lows = BIG5.map(d => { const xs = evs.map(e => todayDomainScore(e, d.id)).filter((x): x is number => x !== null);
    return { d, a: xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null }; }).filter(x => x.a !== null).sort((a, b) => a.a! - b.a!);
  if (lows.length) P.focus = { dom: lows[0].d.id, name: lows[0].d.name, score: lows[0].a! };

  /* 1 · Today */
  add('intro', 'Who is here? · calendar with the full weekday');
  const away = students.filter(s => s.present === false);
  if (away.length) { add('intro', `Welcome back ${names(away)}: one-minute Power Words catch-up with a partner`, 'new', `${away.length} not here today`);
    away.forEach(s => P.kid[s.id].push('Catch up on today: Power Words + Quick Check')); }

  /* 2 · Plan */
  add('today', 'Plan with the six pictures · point and say each part');
  const planK = students.filter(s => notOk(s, 'today'));
  if (planK.length) { add('today', `First · Next strip on the table for ${names(planK)}`, 'chg', `${planK.length} needed support to follow the plan`);
    planK.forEach(s => P.kid[s.id].push('First · Next strip at their seat')); }

  /* 3 · Brain Break */
  const readyK = students.filter(s => notOk(s, 'ready'));
  const lastBB = inp.brainBreaksUsed[inp.brainBreaksUsed.length - 1] || null;
  const bbName = (id: string | null) => C.brainBreaks.find(b => b.id === id)?.en || id || '';
  if (readyK.length >= 3 || (sm.stop_percent !== null && sm.stop_percent < 50)) {
    P.board.bb = 'calm';
    add('ready', `Calm Breathing first${readyK.length ? ` · adult beside ${names(readyK)}` : ''}`, 'chg',
      readyK.length >= 3 ? `${readyK.length} of ${here.length} needed support to get ready` : `Stop check ${sm.stop_percent}% Yes`);
    readyK.forEach(s => P.kid[s.id].push('Calm Breathing with an adult beside'));
  } else {
    P.board.bb = lastBB;
    add('ready', lastBB ? `${bbName(lastBB)} again (it worked today)` : 'Pick the Brain Break for how the class is doing');
  }

  /* 4 · Move together */
  const helperK = students.filter(s => notOk(s, 'move'));
  if (sm.stop_percent !== null && sm.stop_percent < 50) {
    add('move', 'Play the stop-and-go part again before adding a new skill', 'chg', `Stop check: ${sm.stop_yes} Yes of ${sm.stop_yes + sm.stop_no} (${sm.stop_percent}%)`);
  } else if (sm.stop_percent !== null) {
    add('move', 'Keep the routine: GO and STOP at all four places', 'same', `Stop check ${sm.stop_percent}% Yes`);
  } else add('move', 'Let’s Explore Puerto Rico: GO and STOP at all four places');
  const stopNo = students.filter(s => (s.stop || []).filter(v => v === 'N').length > (s.stop || []).filter(v => v === 'Y').length);
  if (stopNo.length) { add('move', `Model STOP with ${names(stopNo)} next to the leader`, 'chg', `${stopNo.length} had more No than Yes`); stopNo.forEach(s => P.kid[s.id].push('Stands next to the leader for STOP')); }
  if (helperK.length) { add('move', `Helper picture cards in hand for “Who helps here?” · ${names(helperK)}`, 'chg', `${helperK.length} needed support to name the helper`); }

  /* 5 · Word wall */
  const miss: Record<string, number> = {};
  students.forEach(s => (s.a1_missed || []).forEach(w => (miss[w] = (miss[w] || 0) + 1)));
  const missed = Object.entries(miss).sort((a, b) => b[1] - a[1]);
  const pre = flagged('preteach_words');
  if (pre.length && missed.length) {
    const wi = C.words.findIndex(w => w.en === missed[0][0]); if (wi >= 0) P.board.word = wi;
    add('wall', `Pre-teach before the reader: ${missed.map(([w, n]) => `${w.toUpperCase()} (${n})`).join(' · ')}`, 'chg', `${pre.length} of ${sm.screened} screened had a Power Word to pre-teach`);
    add('wall', `Start the wall on ${missed[0][0].toUpperCase()}, then the rest as a quick review`, 'new', `${missed[0][0]} missed by ${missed[0][1]}`);
    pre.forEach(s => { const m = s.a1_missed || []; if (m.length) P.kid[s.id].push('Pre-teach ' + m.join(', ')); });
  } else add('wall', 'Five Power Words, one card at a time · say it, show it');

  /* 6 · Letters */
  const snd = flagged('sound_game'), letK = students.filter(s => notOk(s, 'pep'));
  if (snd.length) { P.board.letter = Math.max(0, C.letters.findIndex(l => l.L === 'H'));
    add('pep', 'Quick /h/ sound game first: HELP or SEE? (2 minutes)', 'chg', `${snd.length} of ${sm.screened} scored 0–1 on the target sound`);
    snd.forEach(s => P.kid[s.id].push('/h/ sound game')); }
  else add('pep', 'H · D · S · G with the word for each');
  if (letK.length) add('pep', `Tactile letter cards for ${names(letK)}`, 'chg', `${letK.length} needed support on letters`);

  /* 7 · Read together */
  const L = sm.class_level;
  if (L) add('read', `Reader Level ${L} for the whole class`, 'same', `Quick Check class level ${L} (L1 ${sm.level_counts[1]} · L2 ${sm.level_counts[2]} · L3 ${sm.level_counts[3]})`);
  else add('read', 'Reader level from tomorrow’s Quick Check');
  const model = flagged('needs_model');
  if (model.length) { add('read', `Partner echo, then fade support: ${names(model)}`, 'chg', `${model.length} understand but need a model`); model.forEach(s => P.kid[s.id].push('Partner echo, then fade')); }
  const l1 = students.filter(s => res(s)?.start_level === 1), l3 = students.filter(s => res(s)?.start_level === 3);
  if (L && l1.length && L > 1) add('read', `Re-read the Level 1 pages with an adult: ${names(l1)}`, 'new', `${l1.length} at Level 1`);
  if (L && l3.length && L < 3) add('read', `${names(l3)} read the Level 3 story aloud to the group`, 'new', `${l3.length} at Level 3 · they lead`);

  /* 8 · Comprehension */
  add('comp', `Picture sequencing with ${C.sequenceCount[L || 2] ?? 3} pictures`);
  const ordK = students.filter(s => notOk(s, 'comp'));
  if (ordK.length) add('comp', `Call first: ${names(ordK)} · First · Next cards on the table`, 'chg', `${ordK.length} needed support to order the pictures`);
  const reOpen = students.filter(s => res(s)?.rescreen_needed && !res(s)?.rescreen_done);
  if (reOpen.length) { add('comp', `Second screen still open: ${names(reOpen)} · finish at centers`, 'new', `${reOpen.length} flagged and not re-screened yet`);
    reOpen.forEach(s => P.kid[s.id].push(`Second screen: items ${res(s).flagged_items.join(', ')}`)); }

  // per child: supports from the profile go first
  students.forEach(s => { const c = prof(s); if (c) P.kid[s.id].unshift(c.supports[0]); });
  // family note: the most-missed Power Word
  const top = missed[0]?.[0], w = C.words.find(x => x.en === top);
  P.family = w ? `At home: find “${w.en} / ${w.es}” in a picture book and act it out together.` : 'At home: name the helpers you see on the way home: teacher, cashier, firefighter, park ranger.';
  // Big 5 focus: the lowest domain in today's evidence gets a 5-minute small group in the box that teaches it
  if (P.focus) {
    const where: Record<DomainId, string> = { bk: 'move', ol: 'wall', pa: 'pep', ak: 'pep', cp: 'comp' };
    const act: Record<DomainId, string> = { bk: 'name a helper for each place card', ol: 'two-word phrase with each card (“we help”, “we go”)',
      pa: 'clap help · see · stop and find the /h/ word', ak: 'trace H, D, S, G and match each to its picture', cp: 'order three pictures and tell First · Next · Last' };
    const low = students.filter((s, i) => { const t = todayDomainScore(evs[i], P.focus!.dom); return t !== null && t < 50; });
    if (low.length) { add(where[P.focus.dom], `Big 5 focus · ${P.focus.name}: 5-min small group, ${act[P.focus.dom]} · ${names(low)}`, 'new', `Lowest domain today: ${P.focus.score}/100`);
      low.forEach(s => P.kid[s.id].push(`Big 5 · ${P.focus!.name} small group`)); }
  }
  P.basis = `${sm.screened} screened · ${here.length} here · stop check ${sm.stop_percent === null ? '–' : sm.stop_percent + '%'}`;
  return P;
}
export { GROUP_LABEL };
