'use client';
/* Primary screen (assistant; the toolkit's Quick Check): the pilot portal's Screen tab, same rules (scoring.js, screen-items.js), same fields.
 * Roster → one student → one item per screen → bonus → response mode & engagement → Save → summary.
 * Second screen: flagged items only (Level 1–2, scored 0–1). A missing item is never a zero. */
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import AssessNav from '@/components/AssessNav';
import { given, meName, result, setField, St, students, summary, useRuntime, type ScreenItem, type Student } from '@/lib/runtime';
import { flagText } from '@/lib/runtime';
import { INDICATOR, STATUS_ICON, todayEvidence, domainOf } from '@/lib/big5';
import { fillQuickCheck, sampleReady } from '@/lib/sample';
import { Avatar, fmtSecs, LevelPill, toast } from '@/components/ui';

const ZERO_REASONS = ['Distracted', 'Did not want to take part', 'Did not seem to understand', 'Upset or tired'];
const STEP_WRAP = 6, STEP_SUM = 7;
const ITEMS = () => window.WEHELP_ITEMS;
// Item 1: the screener taps the Power Words the child gets; the score follows (5 → 3 · 3–4 → 2 · 1–2 → 1).
// Stored as a1_missed, the pilot's field, so data and CSV stay the same.
const a1FromGot = (n: number) => (n === 5 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0);
const firstOpenStep = (s: Student) => { for (let i = 0; i < 5; i++) if (!given(s[ITEMS()[i].key])) return i; return 5; };

export default function Page() { return <Shell tab="assess"><Suspense fallback={null}><Screen /></Suspense></Shell>; }

function Screen() {
  const rt = useRuntime(), q = useSearchParams();
  if (!rt.ready) return null;
  const id = q.get('id'), step = q.get('step'), re = q.get('re') === '1';
  return id ? <OneStudent id={id} step={step === null ? null : +step} re={re} /> : <Roster />;
}

function status(s: Student) {
  const r = result(s), started = (['a1', 'a2', 'a3', 'a4', 'a5'] as const).some(k => given(s[k]));
  if (!r.complete) return { cls: started ? 'part' : '', pill: <span className="pill wait">{started ? `In progress · ${5 - r.missing.length} of 5` : 'Not screened'}</span> };
  return { cls: r.rescreen_needed && !r.rescreen_done ? 'flag' : 'done', pill: <><span className="pill">{r.start_total}/15</span><LevelPill L={r.start_level} />
    {r.rescreen_needed ? (r.rescreen_done ? <span className="pill ok">2nd screen {r.growth! >= 0 ? '+' : ''}{r.growth}</span> : <span className="pill re">2nd screen: {r.flagged_items.length} items</span>) : null}</> };
}

function Roster() {
  const router = useRouter(), sm = summary(), list = students(), d = St().get();
  return (
    <div className="stack">
      <AssessNav current="primary" />
      <div className="spread"><p className="muted small">One-to-one, about 2 minutes per child. Toolkit v2.0 · 5 items scored 0–3 · target 8 of 15. Flagged children then appear under Second screen.</p>
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
  const items = re ? r.flagged_items.map(n => all[n - 1]) : all;
  const last = re ? items.length : STEP_SUM;
  const step = step0 === null || isNaN(step0) ? 0 : step0;
  const go = (n: number) => router.push(`/assess/primary/?id=${id}&step=${n}${re ? '&re=1' : ''}`);
  const next = () => go(Math.min(step + 1, last));

  const score = (it: ScreenItem, v: number) => {
    const k = re ? 'r' + it.n : it.key;
    setField(id, x => { x[k] = v; if (!re && it.n === 1 && v === 0) x.a1_missed = window.WeHelpScoring.BIG5.slice(); if (v !== 0 && x.zero_notes) delete x.zero_notes[k]; if (re) x['r' + it.n + '_at'] = St().now(); });
    if (v !== 0 && it.n !== 1) setTimeout(() => { const u = new URL(location.href); if (u.searchParams.get('id') === id && +(u.searchParams.get('step') || 0) === step) next(); }, 380);
  };

  const dots = items.map((it, i) => { const k = re ? 'r' + it.n : it.key;
    return <button key={i} type="button" className={i === step ? 'cur' : given(s[k]) ? 'done' : ''} onClick={() => go(i)} aria-label={`Item ${it.n}`}>{it.n === 'bonus' ? '★' : it.n}</button>; });
  if (!re) dots.push(<button key="w" type="button" className={step === STEP_WRAP ? 'cur' : given(s.response_mode) && given(s.engaged) ? 'done' : ''} onClick={() => go(STEP_WRAP)} aria-label="Mode and engagement">✎</button>);

  let body;
  if (step < items.length) body = <ItemView s={s} it={items[step]} re={re} onScore={score} onNext={next} onPrev={() => step > 0 && go(step - 1)}
    onSkip={() => { setField(id, x => { x.bonus = null; }); go(STEP_WRAP); }} />;
  else if (!re && step === STEP_WRAP) body = <WrapView s={s} onPrev={() => go(step - 1)} onSave={() => {
    const miss = window.WeHelpScoring.missingItems(St().toRec(s)); if (miss.length) { toast('Score item ' + miss.join(', ') + ' first'); return; }
    setField(id, x => { x.finished_at = St().now(); x.screened_by = meName(); }); go(STEP_SUM); }} />;
  else body = re ? <ReSummary s={s} onEdit={() => go(0)} onDone={() => router.push(re ? '/assess/second/' : '/assess/primary/')} /> :
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

function ItemView({ s, it, re, onScore, onNext, onPrev, onSkip }: { s: Student; it: ScreenItem; re: boolean; onScore: (it: ScreenItem, v: number) => void; onNext: () => void; onPrev: () => void; onSkip: () => void }) {
  const k = re ? 'r' + it.n : it.key, v = s[k] as number | null | undefined;
  const ALL = window.WeHelpScoring.BIG5, miss = s.a1_missed || [];
  const got = given(s.a1) ? ALL.filter(w => !miss.includes(w)) : [];
  const note = (s.zero_notes || {})[k] || '';
  const b5 = it.n === 'bonus' ? 'ol2' : ({ 1: 'ol3', 2: 'ol2', 3: 'ol1', 4: 'pa3', 5: 'ol2' } as Record<number, string>)[it.n as number];
  return (
    <div className="item stack sm">
      <div className="area">{it.n === 'bonus' ? 'Bonus' : 'Item ' + it.n} · {it.area}{it.draft ? <span className="draft">draft wording</span> : null}{re ? <span className="pill" style={{ marginLeft: 8 }}>started at {String(s[it.key])}</span> : null}</div>
      <div className="show"><b>Show:</b> {it.show.replace(/Big 5 cards/g, 'Power Word cards')}</div>
      <div className="say">{it.say}</div>
      <div className="row"><Wait5 />
        {b5 ? <span className="tiny muted" style={{ marginLeft: 'auto' }}><span className="sw" style={{ background: domainOf(b5).color }} /> Big 5 evidence: {INDICATOR[b5].text}</span> : null}</div>
      {it.n === 1 && !re ? <div className="missed"><b>Tap the Power Words they get</b>
        <div className="chips">{ALL.map(w => <button key={w} type="button" className={'chip got' + (got.includes(w) ? ' on' : '')} aria-pressed={got.includes(w)} onClick={() =>
          setField(s.id, x => { const g = new Set(given(x.a1) ? ALL.filter(y => !(x.a1_missed || []).includes(y)) : []); if (g.has(w)) g.delete(w); else g.add(w);
            if (!g.size) { x.a1 = null; x.a1_missed = []; return; } // nothing tapped: back to not scored (tap 0 for no response)
            x.a1_missed = ALL.filter(y => !g.has(y)); x.a1 = a1FromGot(g.size); })}>{w}</button>)}</div>
        <span className="muted small">{got.length} of 5 correct. The score below follows; tap 0 for no response.</span></div> : null}
      <div className="scores">{it.rubric.map((txt, i) => <button key={i} type="button" className={'sc' + (v === i ? ' on' : '')} data-s={i} onClick={() => onScore(it, i)}><b>{i}</b><span>{txt}</span></button>)}</div>
      {v === 0 ? <div className="zero"><b>If 0, why?</b>
        <div className="chips">{ZERO_REASONS.map(z => <button key={z} type="button" className={'chip' + (note === z ? ' on' : '')} onClick={() => setField(s.id, x => { x.zero_notes = { ...(x.zero_notes || {}), [k]: z }; })}>{z}</button>)}</div>
        <input type="text" defaultValue={note} key={k + note} placeholder="Or type a short note" onChange={e => { const val = e.target.value; setField(s.id, x => { x.zero_notes = { ...(x.zero_notes || {}), [k]: val }; }); }} /></div> : null}
      <div className="navrow"><button type="button" className="btn" onClick={onPrev}>← Back</button>
        {it.optional ? <button type="button" className="btn ghost" onClick={onSkip}>Skip bonus</button> : null}
        <button type="button" className="btn pri big" disabled={!(given(v) || it.optional)} onClick={onNext}>Next →</button></div>
    </div>);
}

function WrapView({ s, onPrev, onSave }: { s: Student; onPrev: () => void; onSave: () => void }) {
  const miss = window.WeHelpScoring.missingItems(St().toRec(s));
  return (
    <div className="item stack">
      <div className="area">Before you save</div>
      <h3>Main response mode</h3>
      <div className="chips">{window.WeHelpScoring.RESPONSE_MODES.map(m => <button key={m} type="button" className={'chip' + (s.response_mode === m ? ' on' : '')} onClick={() => setField(s.id, x => { x.response_mode = x.response_mode === m ? null : m; })}>{m}</button>)}</div>
      <h3>Motivated and engaged?</h3>
      <div className="row"><button type="button" className={'btn' + (s.engaged === true ? ' on' : '')} onClick={() => setField(s.id, x => { x.engaged = true; })}>Yes</button>
        <button type="button" className={'btn' + (s.engaged === false ? ' on' : '')} onClick={() => setField(s.id, x => { x.engaged = false; })}>No</button></div>
      <input type="text" defaultValue={s.engagement_note || ''} placeholder="One-line note (children never see this)" onChange={e => { const v = e.target.value; setField(s.id, x => { x.engagement_note = v; }); }} />
      {miss.length ? <div className="zero"><b>Still missing: item {miss.join(', ')}</b><span className="small">A missing item is not a zero. Score it, or leave the screen open and come back.</span></div> : null}
      <div className="navrow"><button type="button" className="btn" onClick={onPrev}>← Back</button><button type="button" className="btn pri big" disabled={!!miss.length} onClick={onSave}>Save screen</button></div>
    </div>);
}

function Evidence({ s }: { s: Student }) {
  const ev = Object.values(todayEvidence(s)).filter(e => e.source.startsWith('Quick'));
  if (!ev.length) return null;
  return <div className="stack sm"><h3>Big 5 evidence from this screen</h3><div className="b5ev">{ev.map(e =>
    <span key={e.ind} className="chip" title={e.source}><span className="sw" style={{ background: domainOf(e.ind).color }} />{STATUS_ICON[e.status]} {INDICATOR[e.ind].text}</span>)}</div></div>;
}

function Summary({ s, onEdit, onContinue, onNextStu }: { s: Student; onEdit: () => void; onContinue: () => void; onNextStu: () => void }) {
  const r = result(s);
  if (!r.complete) return <div className="stack"><p>This screen isn’t finished. Missing item {r.missing.join(', ')}.</p><button className="btn pri" type="button" onClick={onContinue}>Continue screen</button></div>;
  const dur = s.started_at && s.finished_at ? Date.parse(s.finished_at) - Date.parse(s.started_at) : null;
  return (
    <div className="stack">
      <h2>{s.name} · saved</h2>
      <div className="sumbox">
        <div className="stat"><small>Total</small><b>{r.start_total}<em> / 15</em></b></div>
        <div className="stat"><small>Target (8+)</small><b>{r.target_met ? 'Met' : 'Not yet'}</b></div>
        <div className="stat"><small>Level</small><b>{r.start_level}</b></div>
        {given(s.bonus) ? <div className="stat"><small>Bonus</small><b>{s.bonus}<em> / 3</em></b></div> : null}
        {dur ? <div className="stat"><small>Time</small><b>{fmtSecs(dur)}</b></div> : null}
      </div>
      {r.flags.length ? <div className="reco">{r.flags.map(f => <div key={f}>{flagText(f)}</div>)}</div> : null}
      {r.rescreen_needed ? <p className="small muted">Second screen later on item {r.flagged_items.join(', ')}.</p> : null}
      <Evidence s={s} />
      <div className="navrow"><button type="button" className="btn" onClick={onEdit}>Edit scores</button><button type="button" className="btn pri big" onClick={onNextStu}>Next child →</button></div>
    </div>);
}

function ReSummary({ s, onEdit, onDone }: { s: Student; onEdit: () => void; onDone: () => void }) {
  const r = result(s), all = ITEMS();
  return (
    <div className="stack">
      <h2>{s.name} · second screen</h2>
      <div className="tablewrap"><table className="res"><thead><tr><th>Reassessed item</th><th>Start</th><th>Now</th></tr></thead><tbody>
        {r.flagged_items.map(n => <tr key={n}><td>Item {n} · {all[n - 1].area}</td><td className="n">{String(s['a' + n])}</td><td className="n">{given(s['r' + n]) ? String(s['r' + n]) : '–'}</td></tr>)}</tbody></table></div>
      <div className="sumbox">
        <div className="stat"><small>Start → end</small><b>{r.start_total} → {r.end_total}</b></div>
        <div className="stat"><small>Change</small><b>{r.growth! >= 0 ? '+' : ''}{r.growth}</b></div>
        <div className="stat"><small>Level</small><b>{r.start_level} → {r.end_level}</b></div>
      </div>
      <p className="small muted">Performance on reassessed items only. Unchanged scores are useful for tomorrow’s plan.</p>
      <div className="navrow"><button type="button" className="btn" onClick={onEdit}>Edit</button><button type="button" className="btn pri big" onClick={onDone}>Done</button></div>
    </div>);
}
