'use client';
/* Primary screen (assistant): the 9-point screen, same rules and fields as the pilot portal (scoring.js, screen-items.js).
 * Roster → one student → items 3–7 → item 8 bonus → response mode & engagement → Save → summary.
 * For each item the screener records what happened (words shown, how many words, steps, sound, words of "We help.",
 * response mode, support) or taps No response / Not administered; WeHelpScoring.scoreItem gives the score and status.
 * Not administered stays blank (never 0); with any item not administered the teacher sets the level.
 * Second screen: flagged items only (Level 1–2: item 3 with 0–2 words, items 4–7 scored 0). */
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import AssessNav from '@/components/AssessNav';
import { given, meName, result, setField, St, students, summary, teacherFlagText, useRuntime, type ItemStatus, type ScreenItem, type Student } from '@/lib/runtime';
import { flagText } from '@/lib/runtime';
import { INDICATOR, QC_B5, STATUS_ICON, todayEvidence, domainOf } from '@/lib/big5';
import { fillQuickCheck, sampleReady } from '@/lib/sample';
import { Avatar, fmtSecs, LevelPill, toast } from '@/components/ui';

const ZERO_REASONS = ['Distracted', 'Did not want to take part', 'Did not seem to understand', 'Upset or tired'];
const NA_REASONS = ['Ran out of time', 'Child left the screen', 'Not ready today', 'Item skipped by mistake'];
const STEP_WRAP = 6, STEP_SUM = 7;
const ITEMS = () => window.WEHELP_ITEMS;
const CORE = () => ITEMS().filter(it => !it.optional);
const itemByN = (n: number) => ITEMS().find(it => it.n === n)!;
const Sc = () => window.WeHelpScoring;
const firstOpenStep = (s: Student) => { const c = CORE(); for (let i = 0; i < c.length; i++) if (!given(s[c[i].key + '_status'])) return i; return c.length; };
const fieldKey = (it: ScreenItem, re: boolean) => (re ? it.key.replace(/^a/, 'r') : it.key);
const powerWords = (t: string) => t.replace(/Big 5 (cards|words)/g, 'Power Word $1');

/** Recompute score + status for one item from what the screener recorded (same as the pilot portal). */
function rescore(x: Student, it: ScreenItem, k: string) {
  if (it.optional) return;
  const pick = x[k + '_pick'] as string | null | undefined;
  let res: { score: number | null; status: ItemStatus } | null = null;
  if (pick) res = Sc().scoreItem(it.n, { status: pick });
  else if (it.input === 'words') res = x[k + '_done'] ? Sc().scoreItem(it.n, { words: x[k + '_words'] || [] }) : null;
  else if (it.input === 'count') res = Sc().scoreItem(it.n, { count: x[k + '_count'] });
  else if (it.input === 'steps') res = Sc().scoreItem(it.n, { steps: x[k + '_steps'], in_order: x[k + '_in_order'] });
  else if (it.input === 'sound') res = Sc().scoreItem(it.n, { sound: x[k + '_sound'] });
  else if (it.input === 'anchor') res = Sc().scoreItem(it.n, { anchor: x[k + '_anchor'] });
  x[k] = res ? res.score : null; x[k + '_status'] = res ? res.status : null;
  if (x[k] !== 0 && x[k + '_status'] !== 'not_administered' && x.zero_notes) delete x.zero_notes[k];
}
function setItem(id: string, it: ScreenItem, re: boolean, fn: (x: Student, k: string) => void) {
  const k = fieldKey(it, re);
  setField(id, x => { fn(x, k); rescore(x, it, k); if (re) x[k + '_at'] = St().now(); });
}

export default function Page() { return <Shell tab="assess"><Suspense fallback={null}><Screen /></Suspense></Shell>; }

function Screen() {
  const rt = useRuntime(), q = useSearchParams();
  if (!rt.ready) return null;
  const id = q.get('id'), step = q.get('step'), re = q.get('re') === '1';
  return id ? <OneStudent id={id} step={step === null ? null : +step} re={re} /> : <Roster />;
}

function status(s: Student) {
  const r = result(s), core = CORE(), started = core.some(it => given(s[it.key + '_status']) || given(s[it.key]));
  if (r.invalid) return { cls: 'flag', pill: <span className="pill re" title={r.invalid}>Old 0–3 scores · screen again</span> };
  if (!r.complete) return { cls: started ? 'part' : '', pill: <span className="pill wait">{started ? `In progress · ${core.length - r.missing.length} of ${core.length}` : 'Not screened'}</span> };
  return { cls: (r.rescreen_needed && !r.rescreen_done) || r.needs_teacher_level ? 'flag' : 'done', pill: <>
    {r.start_total !== null ? <span className="pill">{r.start_total}/9</span> : <span className="pill">Item {r.not_administered.join(', ')} not given</span>}
    {r.needs_teacher_level ? <span className="pill re">Teacher sets level</span> : <><LevelPill L={r.start_level} />{r.level_override ? <span className="pill">set by teacher</span> : null}</>}
    {r.teacher_flags.includes('zero_total') ? <span className="pill re">Total 0 · review</span> : null}
    {r.rescreen_needed ? (r.rescreen_done ? <span className="pill ok">2nd screen {r.growth! >= 0 ? '+' : ''}{r.growth}</span> : <span className="pill re">2nd screen: {r.flagged_items.length} items</span>) : null}</> };
}

function Roster() {
  const router = useRouter(), sm = summary(), list = students(), d = St().get();
  return (
    <div className="stack">
      <AssessNav current="primary" />
      <div className="spread"><p className="muted small">One-to-one, about 2 minutes per child. 9-point screen: items 3–7 (item 3 is 0–5, items 4–7 are 0–1), item 8 bonus not scored. Levels: 0–3 → 1 · 4–6 → 2 · 7–9 → 3. Flagged children then appear under Second screen.</p>
        <div className="row"><span className="pill">{sm.screened} of {list.length} screened</span>{sm.class_level ? <><span className="pill">Class level so far</span><LevelPill L={sm.class_level} /></> : null}
          {d.demo && sampleReady(d) && !sm.screened ? <button type="button" className="btn ghost sm" onClick={() => { St().update(x => fillQuickCheck(x, St().now(), false)); toast('Sample screens for the 8 demo children'); }}>Fill sample screens</button> : null}</div></div>
      <div className="roster">{list.map(s => { const st = status(s); return (
        <button type="button" key={s.id} className={'stu ' + st.cls} onClick={() => router.push(`/assess/primary/?id=${s.id}&step=${result(s).complete ? STEP_SUM : firstOpenStep(s)}`)}>
          <span className="top"><Avatar name={s.name} /><span><span className="muted tiny">#{s.no}</span><br /><b>{s.name}</b></span>{s.present === false ? <span className="pill wait" style={{ marginLeft: 'auto' }}>not here</span> : null}</span>
          <span className="row" style={{ gap: 5 }}>{st.pill}</span></button>); })}</div>
    </div>);
}

function OneStudent({ id, step: step0, re }: { id: string; step: number | null; re: boolean }) {
  const router = useRouter();
  const s0 = St().student(id);
  useEffect(() => { // start the clock the first time this student is opened (same as the pilot)
    if (!s0) return;
    if (!re && !s0.started_at) setField(id, x => { x.started_at = St().now(); });
    if (re && !s0.re_started_at) setField(id, x => { x.re_started_at = St().now(); });
  }, [id, re, s0]);
  if (!s0) return <div className="empty">This child isn’t on the roster. <button className="btn" onClick={() => router.push(re ? '/assess/second/' : '/assess/primary/')}>Back to the roster</button></div>;
  const s = s0, r = result(s), all = ITEMS();
  const items = re ? r.flagged_items.map(itemByN) : all;
  const last = re ? items.length : STEP_SUM;
  const step = step0 === null || isNaN(step0) ? 0 : step0;
  const go = (n: number) => router.push(`/assess/primary/?id=${id}&step=${n}${re ? '&re=1' : ''}`);
  const next = () => go(Math.min(step + 1, last));

  const dots = items.map((it, i) => { const k = fieldKey(it, re), v = it.optional ? s.bonus : s[k + '_status'];
    return <button key={i} type="button" className={i === step ? 'cur' : given(v) ? 'done' : ''} onClick={() => go(i)} aria-label={`Item ${it.n}`}>{it.optional ? '★' : it.n}</button>; });
  if (!re) dots.push(<button key="w" type="button" className={step === STEP_WRAP ? 'cur' : given(s.response_mode) && given(s.engaged) ? 'done' : ''} onClick={() => go(STEP_WRAP)} aria-label="Mode and engagement">✎</button>);

  let body;
  if (step < items.length) body = <ItemView s={s} it={items[step]} re={re} onNext={next} onPrev={() => step > 0 && go(step - 1)} />;
  else if (!re && step === STEP_WRAP) body = <WrapView s={s} onPrev={() => go(step - 1)} onSave={() => {
    const miss = Sc().missingItems(St().toRec(s)); if (miss.length) { toast('Record item ' + miss.join(', ') + ' first'); return; }
    setField(id, x => { x.finished_at = St().now(); x.screened_by = meName(); }); go(STEP_SUM); }} />;
  else body = re ? <ReSummary s={s} onEdit={() => go(0)} onDone={() => router.push('/assess/second/')} /> :
    <Summary s={s} onEdit={() => go(0)} onContinue={() => go(firstOpenStep(s))} onNextStu={() => { const nx = students().find(x => x.id !== id && !result(x).complete); router.push(nx ? `/assess/primary/?id=${nx.id}&step=0` : '/assess/primary/'); }} />;

  return (
    <div className="stack">
      <div className="scr-top"><button className="btn ghost" type="button" onClick={() => router.push(re ? '/assess/second/' : '/assess/primary/')}>← Roster</button><Avatar name={s.name} /><span className="who">{s.name}</span>
        {re ? <span className="pill re">Second screen</span> : null}<Clock s={s} re={re} /></div>
      <div className="steps">{dots}</div>
      <div className="card pad">{body}</div>
    </div>);
}

function Clock({ s, re }: { s: Student; re: boolean }) {
  const from = re ? s.re_started_at : s.started_at, to = re ? null : s.finished_at;
  const [, tick] = useState(0);
  useEffect(() => { if (!from || to) return; const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, [from, to]);
  if (!from) return <span className="clock" />;
  const ms = (to ? Date.parse(to) : Date.now()) - Date.parse(from);
  return <span className={'clock' + (!re && ms > 120000 ? ' slow' : '')}>⏱ {fmtSecs(ms)}</span>;
}

function Wait5() {
  const [st, setSt] = useState<'' | 'run' | 'end'>(''), t = useRef<ReturnType<typeof setTimeout>>(undefined);
  return <button type="button" className={'btn wait5 ' + st} onClick={() => { setSt(''); requestAnimationFrame(() => setSt('run')); clearTimeout(t.current); t.current = setTimeout(() => setSt('end'), 5000); }}><i />⏱ Wait 5 s</button>;
}

const SUPPORT = () => Object.entries(Sc().SUPPORT);
function OptRow({ title, cur, list, onPick }: { title: string; cur: unknown; list: [string, string][]; onPick: (v: string) => void }) {
  return <div className="missed"><b>{title}</b><div className="chips">{list.map(([v, label]) =>
    <button key={v} type="button" className={'chip' + (cur === v ? ' on' : '')} aria-pressed={cur === v} onClick={() => onPick(v)}>{label}</button>)}</div></div>;
}

function ItemView({ s, it, re, onNext, onPrev }: { s: Student; it: ScreenItem; re: boolean; onNext: () => void; onPrev: () => void }) {
  const k = fieldKey(it, re), v = s[k] as number | null | undefined, st = s[k + '_status'] as string | null | undefined;
  const pick = s[k + '_pick'] as string | null | undefined, off = !!pick;
  const note = (s.zero_notes || {})[k] || '';
  const b5 = QC_B5[it.key];
  const set = (fn: (x: Student, k: string) => void) => setItem(s.id, it, re, fn);
  const raw = (f: string, val: unknown) => set((x, kk) => { x[kk + '_' + f] = val; x[kk + '_pick'] = null; });
  const opt = (f: string) => (val: string) => set((x, kk) => { x[kk + '_' + f] = x[kk + '_' + f] === val ? null : val; });
  const btn = (on: boolean, label: ReactNode, onClick: () => void, key?: string | number) =>
    <button key={key ?? String(label)} type="button" className={'sc' + (on ? ' on' : '')} aria-pressed={on} onClick={onClick}><b>{label}</b></button>;
  const modes: [string, string][] = Sc().RESPONSE_MODES.map(m => [m, m]);

  let inputs: ReactNode = null;
  if (it.input === 'words') {
    const ALL = Sc().BIG5, got = (s[k + '_words'] as string[] | undefined) || [], done = !!s[k + '_done'];
    inputs = <div className="missed"><b>Tap each Power Word the child shows correctly</b>
      <div className="chips">{ALL.map(w => <button key={w} type="button" className={'chip got' + (!off && got.includes(w) ? ' on' : '')} aria-pressed={!off && got.includes(w)} onClick={() =>
        set((x, kk) => { const g = new Set((x[kk + '_words'] as string[] | undefined) || []); if (g.has(w)) g.delete(w); else g.add(w);
          x[kk + '_words'] = ALL.filter(y => g.has(y)); x[kk + '_done'] = true; x[kk + '_pick'] = null; })}>{w}</button>)}
        <button type="button" className={'chip' + (!off && done && !got.length ? ' on' : '')} onClick={() => set((x, kk) => { x[kk + '_words'] = []; x[kk + '_done'] = true; x[kk + '_pick'] = null; })}>None correct (tried)</button></div>
      <span className="muted small">{off || !done ? 'Not recorded yet.' : `${got.length} of 5 correct.`}</span></div>;
  } else if (it.input === 'count') {
    const c = s[k + '_count'];
    inputs = <><div className="missed"><b>How many of the 5 Power Words did the child communicate?</b></div>
      <div className="scores six">{[0, 1, 2, 3, 4, 5].map(n => btn(!off && c === n, n, () => raw('count', n), n))}</div>
      <OptRow title="Response mode" cur={s[k + '_mode']} list={modes} onPick={opt('mode')} />
      <OptRow title="Support" cur={s[k + '_support']} list={SUPPORT()} onPick={opt('support')} /></>;
  } else if (it.input === 'steps') {
    const sp = s[k + '_steps'], io = s[k + '_in_order'];
    const stepsBtn = (n: number, order: boolean | null, label: string, on: boolean) => btn(!off && on, label, () => set((x, kk) => { x[kk + '_steps'] = n; x[kk + '_in_order'] = order; x[kk + '_pick'] = null; }), label);
    inputs = <><div className="scores txt">{[stepsBtn(0, null, 'No steps', sp === 0), stepsBtn(1, null, 'One step', sp === 1),
      stepsBtn(2, false, 'Both steps, out of order', sp === 2 && io === false), stepsBtn(2, true, 'Both steps, in order', sp === 2 && io !== false)]}</div>
      <OptRow title="Assistance" cur={s[k + '_support']} list={SUPPORT()} onPick={opt('support')} /></>;
  } else if (it.input === 'sound') {
    const so = s[k + '_sound'];
    inputs = <div className="scores txt">{btn(!off && so === true, 'Correct sound', () => raw('sound', true))}{btn(!off && so === false, 'Incorrect sound', () => raw('sound', false))}</div>;
  } else if (it.input === 'anchor') {
    const an = s[k + '_anchor'];
    inputs = <><div className="scores txt">{btn(!off && an === 2, 'Both words: “We help.”', () => raw('anchor', 2))}{btn(!off && an === 1, 'One word', () => raw('anchor', 1))}{btn(!off && an === 0, 'Tried, no words', () => raw('anchor', 0))}</div>
      <OptRow title="Response mode" cur={s[k + '_mode']} list={modes} onPick={opt('mode')} />
      <OptRow title="Support" cur={s[k + '_support']} list={SUPPORT()} onPick={opt('support')} /></>;
  } else if (it.input === 'bonus') {
    inputs = <div className="scores txt">{Sc().BONUS.map(b => btn(s.bonus === b, b, () => setField(s.id, x => { x.bonus = x.bonus === b ? null : b; }), b))}</div>;
  }

  return (
    <div className="item stack sm">
      <div className="area">{it.optional ? 'Item 8 · Bonus' : 'Item ' + it.n} · {it.area}{it.draft ? <span className="draft">draft wording</span> : null}{re ? <span className="pill" style={{ marginLeft: 8 }}>started at {String(s[it.key])}</span> : null}</div>
      <div className="show"><b>Show:</b> {powerWords(it.show)}</div>
      <div className="say">{it.say}</div>
      <div className="row"><Wait5 />
        {b5 ? <span className="tiny muted" style={{ marginLeft: 'auto' }}><span className="sw" style={{ background: domainOf(b5).color }} /> Big 5 evidence: {INDICATOR[b5].text}</span> : null}</div>
      <p className="small muted" style={{ margin: 0 }}>{it.rule}</p>
      {inputs}
      {it.optional ? null : <>
        <div className="row">
          <button type="button" className={'chip' + (pick === 'no_response' ? ' on' : '')} onClick={() => set((x, kk) => { x[kk + '_pick'] = x[kk + '_pick'] === 'no_response' ? null : 'no_response'; })}>No response</button>
          <button type="button" className={'chip' + (pick === 'not_administered' ? ' on' : '')} onClick={() => set((x, kk) => { x[kk + '_pick'] = x[kk + '_pick'] === 'not_administered' ? null : 'not_administered'; })}>Not administered</button></div>
        <div className="stat"><small>Result</small><b>{st ? <>{v === null || v === undefined ? 'blank' : <>{v}<em> / {Sc().MAX[it.n]}</em></>} · {Sc().STATUS[st as ItemStatus]}</> : <em>not recorded yet</em>}</b></div>
        {st === 'not_administered' || v === 0 ? <div className="zero"><b>{st === 'not_administered' ? 'Why not administered?' : 'If 0, why?'}</b>
          <div className="chips">{(st === 'not_administered' ? NA_REASONS : ZERO_REASONS).map(z => <button key={z} type="button" className={'chip' + (note === z ? ' on' : '')} onClick={() => setField(s.id, x => { x.zero_notes = { ...(x.zero_notes || {}), [k]: z }; })}>{z}</button>)}</div>
          <input type="text" defaultValue={note} key={k + note} placeholder="Or type a short note" onChange={e => { const val = e.target.value; setField(s.id, x => { x.zero_notes = { ...(x.zero_notes || {}), [k]: val }; }); }} /></div> : null}
      </>}
      <div className="navrow"><button type="button" className="btn" onClick={onPrev}>← Back</button>
        <button type="button" className="btn pri big" disabled={!(given(st) || it.optional)} onClick={onNext}>Next →</button></div>
    </div>);
}

function WrapView({ s, onPrev, onSave }: { s: Student; onPrev: () => void; onSave: () => void }) {
  const miss = Sc().missingItems(St().toRec(s));
  return (
    <div className="item stack">
      <div className="area">Before you save</div>
      <h3>Main response mode</h3>
      <div className="chips">{Sc().RESPONSE_MODES.map(m => <button key={m} type="button" className={'chip' + (s.response_mode === m ? ' on' : '')} onClick={() => setField(s.id, x => { x.response_mode = x.response_mode === m ? null : m; })}>{m}</button>)}</div>
      <h3>Motivated and engaged?</h3>
      <div className="row"><button type="button" className={'btn' + (s.engaged === true ? ' on' : '')} onClick={() => setField(s.id, x => { x.engaged = true; })}>Yes</button>
        <button type="button" className={'btn' + (s.engaged === false ? ' on' : '')} onClick={() => setField(s.id, x => { x.engaged = false; })}>No</button></div>
      <input type="text" defaultValue={s.engagement_note || ''} placeholder="One-line note (children never see this)" onChange={e => { const v = e.target.value; setField(s.id, x => { x.engagement_note = v; }); }} />
      {miss.length ? <div className="zero"><b>Still missing: item {miss.join(', ')}</b><span className="small">Record a result for each item, or mark it Not administered. A missing item is never a zero.</span></div> : null}
      <div className="navrow"><button type="button" className="btn" onClick={onPrev}>← Back</button><button type="button" className="btn pri big" disabled={!!miss.length} onClick={onSave}>Save screen</button></div>
    </div>);
}

function Evidence({ s }: { s: Student }) {
  const ev = Object.values(todayEvidence(s)).filter(e => e.source.startsWith('Primary'));
  if (!ev.length) return null;
  return <div className="stack sm"><h3>Big 5 evidence from this screen</h3><div className="b5ev">{ev.map(e =>
    <span key={e.ind} className="chip" title={e.source}><span className="sw" style={{ background: domainOf(e.ind).color }} />{STATUS_ICON[e.status]} {INDICATOR[e.ind].text}</span>)}</div></div>;
}

/** Teacher override: required when an item was not administered, optional otherwise. */
function LevelPicker({ s }: { s: Student }) {
  const r = result(s), need = r.not_administered.length > 0;
  return (
    <div className="card pad stack sm">
      <h3>{need ? 'Teacher sets the starting level' : 'Change the starting level'}</h3>
      <p className="small muted" style={{ margin: 0 }}>{need ? `Item ${r.not_administered.join(', ')} was not administered, so there is no automatic level.` : `Automatic level: ${r.auto_level}. Only change it if the teacher decides to.`}</p>
      <div className="row">{[1, 2, 3].map(L => <button key={L} type="button" className={'btn' + (r.level_override === L ? ' on' : '')}
        onClick={() => setField(s.id, x => { x.level_override = x.level_override === L ? null : L; x.level_override_by = meName(); x.level_override_at = St().now(); })}>Level {L}</button>)}</div>
      {r.level_override ? <><input type="text" defaultValue={s.level_override_reason || ''} placeholder="Reason (saved with the level)" onChange={e => { const v = e.target.value; setField(s.id, x => { x.level_override_reason = v; }); }} />
        {s.level_override_by ? <span className="small muted">Set by {s.level_override_by}</span> : null}</> : null}
    </div>);
}

function Summary({ s, onEdit, onContinue, onNextStu }: { s: Student; onEdit: () => void; onContinue: () => void; onNextStu: () => void }) {
  const r = result(s);
  if (!r.complete) return <div className="stack"><p>This screen isn’t finished. Missing item {r.missing.join(', ')}.</p><button className="btn pri" type="button" onClick={onContinue}>Continue screen</button></div>;
  const dur = s.started_at && s.finished_at ? Date.parse(s.finished_at) - Date.parse(s.started_at) : null;
  const notes = [...r.teacher_flags.map(teacherFlagText), ...r.flags.map(flagText)];
  return (
    <div className="stack">
      <h2>{s.name} · saved</h2>
      <div className="sumbox">
        {r.start_total !== null ? <><div className="stat"><small>Total</small><b>{r.start_total}<em> / 9</em></b></div>
          <div className="stat"><small>Target ({Sc().TARGET}+)</small><b>{r.target_met ? 'Met' : 'Not yet'}</b></div></>
          : <div className="stat"><small>Total</small><b>–<em> {r.partial_total} on the items given</em></b></div>}
        <div className="stat"><small>Level</small><b>{r.start_level ?? '–'}{r.level_override ? <em> teacher</em> : null}</b></div>
        {given(s.bonus) ? <div className="stat"><small>Bonus</small><b>{s.bonus}</b></div> : null}
        {dur ? <div className="stat"><small>Time</small><b>{fmtSecs(dur)}</b></div> : null}
      </div>
      {notes.length ? <div className="reco">{notes.map(t => <div key={t}>{t}</div>)}</div> : null}
      <div className="tablewrap"><table className="res"><thead><tr><th>Item</th><th>Score</th><th>Status</th></tr></thead><tbody>
        {r.items.map(i => <tr key={i.n}><td>{i.n} · {Sc().ITEM_INFO[i.n].area}</td><td className="n">{i.score === null ? '' : `${i.score} / ${Sc().MAX[i.n]}`}</td><td>{i.status ? Sc().STATUS[i.status] : ''}</td></tr>)}</tbody></table></div>
      <LevelPicker s={s} />
      {r.rescreen_needed ? <p className="small muted">Second screen later on item {r.flagged_items.join(', ')}.</p> : null}
      <Evidence s={s} />
      <div className="navrow"><button type="button" className="btn" onClick={onEdit}>Edit scores</button><button type="button" className="btn pri big" onClick={onNextStu}>Next child →</button></div>
    </div>);
}

function ReSummary({ s, onEdit, onDone }: { s: Student; onEdit: () => void; onDone: () => void }) {
  const r = result(s);
  return (
    <div className="stack">
      <h2>{s.name} · second screen</h2>
      <div className="tablewrap"><table className="res"><thead><tr><th>Reassessed item</th><th>Start</th><th>Now</th></tr></thead><tbody>
        {r.flagged_items.map(n => { const it = itemByN(n), b = s[fieldKey(it, true)];
          return <tr key={n}><td>Item {n} · {it.area}</td><td className="n">{String(s[it.key])}</td><td className="n">{given(b) ? String(b) : '–'}</td></tr>; })}</tbody></table></div>
      <div className="sumbox">
        <div className="stat"><small>Start → end</small><b>{r.start_total} → {r.end_total}</b></div>
        <div className="stat"><small>Change</small><b>{r.growth! >= 0 ? '+' : ''}{r.growth}</b></div>
        <div className="stat"><small>Level</small><b>{r.start_level} → {r.end_level}</b></div>
      </div>
      <p className="small muted">Performance on reassessed items only. Unchanged scores are useful for tomorrow’s plan.</p>
      <div className="navrow"><button type="button" className="btn" onClick={onEdit}>Edit</button><button type="button" className="btn pri big" onClick={onDone}>Done</button></div>
    </div>);
}
