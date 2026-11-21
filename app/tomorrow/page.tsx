'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Shell, { leadOnly } from '@/components/Shell';
import { C, St, students, summary, useRuntime } from '@/lib/runtime';
import { generatePlan, type Plan } from '@/lib/plan';
import { GROUP_LABEL, type Group } from '@/lib/big5';
import { childByName } from '@/lib/children';
import { Avatar, Ico, toast } from '@/components/ui';

const KEY = (d: string) => `dreams-plan:v1:${d}`;
interface Saved { plan: Plan; at: string; by: string }
const load = (d: string): Saved | null => { try { return JSON.parse(localStorage.getItem(KEY(d)) || 'null'); } catch { return null; } };

export default function Page() { const rt = useRuntime(); return <Shell tab="tomorrow">{rt.ready ? <Tomorrow /> : null}</Shell>; }

function build(): Plan {
  const list = students(), sm = summary(), c = C(), d = St().get();
  return generatePlan({ students: list, results: sm.students, summary: sm, brainBreaksUsed: d.activity.brainBreaks.map(b => b.id),
    content: { boxes: c.boxes, words: c.words, letters: c.letters, brainBreaks: c.brainBreaks, sequenceCount: c.sequenceCount }, date: d.session.date });
}

function Tomorrow() {
  const rt = useRuntime(), d = St().get(), c = C(), list = students(), sm = summary();
  const [saved, setSaved] = useState<Saved | null>(null), [edit, setEdit] = useState(false), [draft, setDraft] = useState<Plan | null>(null);
  useEffect(() => { setSaved(load(d.session.date)); }, [d.session.date]);
  const live = useMemo(() => build(), [rt.v]); // eslint-disable-line react-hooks/exhaustive-deps
  const P = draft || saved?.plan || live;
  const anything = list.some(s => s.present !== undefined || Object.keys(s.obs || {}).length) || sm.screened > 0;
  if (!anything) return (
    <div className="card pad stack" style={{ textAlign: 'center', alignItems: 'center' }}>
      <h2>Tomorrow’s plan</h2><p className="muted">Nothing is recorded for today yet. The plan is built from the lesson: attendance, box observations, primary screen and stop check.</p>
      <Link href="/lesson/" className="btn red big"><Ico n="play" s={16} c="#fff" fill /> Start the lesson</Link></div>);

  const setLine = (box: string, i: number, text: string) => setDraft(p => { const q: Plan = JSON.parse(JSON.stringify(p || P)); q.boxes[box][i].text = text; return q; });
  const save = () => { const s: Saved = { plan: draft || P, at: new Date().toISOString(), by: St().me()?.name || '' };
    try { localStorage.setItem(KEY(d.session.date), JSON.stringify(s)); } catch { /* storage full or blocked */ } setSaved(s); setDraft(null); setEdit(false); toast('Plan saved on this iPad'); };
  const rebuild = () => { try { localStorage.removeItem(KEY(d.session.date)); } catch { /* ignore */ } setSaved(null); setDraft(null); toast('Rebuilt from the latest data'); };
  const nchg = Object.values(P.boxes).flat().filter(l => l.kind !== 'same').length;
  const B = P.board, bbName = c.brainBreaks.find((b: { id: string }) => b.id === B.bb)?.en;
  const applyBoard = () => {
    if (!leadOnly()) return;
    if (!confirm(`Set up the board for ${P.label}? It goes back to box 1 with today’s game, sequencing and attendance cleared, then applies the presets below.`)) return;
    const s = St().board; s.send('reset'); if (B.level) s.send('setLevel', B.level, 'tomorrow plan'); s.send('setBrainBreak', B.bb || '');
    s.send('setWord', B.word); s.send('setLetter', B.letter); s.send('goto', 1); toast('Board set up for tomorrow');
  };
  const color = (id: string) => `var(--${c.boxes.find((b: { id: string }) => b.id === id)?.color})`;
  const byId = Object.fromEntries(list.map(s => [s.id, s]));
  return (
    <div className="stack">
      <div className="hero">
        <div><div className="hk">Tomorrow · We Help! day 2</div><h1>{P.label}</h1>
          <p>Built from today: {P.basis}. {nchg} change{nchg === 1 ? '' : 's'} from today, each with the number behind it.</p>
          {saved ? <p className="small" style={{ marginTop: 8 }}>Saved {new Date(saved.at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}{saved.by ? ' by ' + saved.by : ''}.</p> : null}</div>
        <div className="row noprint" style={{ justifyContent: 'flex-end' }}>
          {edit ? <button className="btn white" type="button" onClick={() => { setDraft(null); setEdit(false); }}>Cancel</button> : <button className="btn white" type="button" onClick={() => setEdit(true)}>Edit lines</button>}
          <button className="btn red" type="button" onClick={save}>Save plan</button>
          <button className="btn white" type="button" onClick={() => window.print()}>Print</button>
          {saved && !edit ? <button className="btn white" type="button" onClick={rebuild}>Rebuild from latest data</button> : null}</div>
        <div className="deco"><span className="shapes lg"><i className="sq" /><i className="ci" /><i className="tr" /></span></div>
      </div>

      <div className="card pad stack sm">
        <div className="spread"><h3>Tomorrow’s board, ready to go</h3>
          <div className="row noprint"><span className={'conn' + (rt.connected ? ' on' : '')}><i />{rt.connected ? 'Board connected' : 'Board not open'}</span>
            <button className="btn navy" type="button" disabled={!rt.connected} onClick={applyBoard}><Ico n="board" s={17} c="#fff" /> Set up the board for tomorrow</button></div></div>
        <div className="presets">
          <div className="preset"><small>Reader level</small><b>{B.level ? `Level ${B.level}` : 'From the primary screen'}</b></div>
          <div className="preset"><small>Brain Break</small><b>{bbName || 'Teacher picks'}</b></div>
          <div className="preset"><small>Word wall starts on</small><b>{c.words[B.word]?.en.toUpperCase()}</b></div>
          <div className="preset"><small>Letters start on</small><b>{c.letters[B.letter]?.L} · {c.letters[B.letter]?.word}</b></div>
        </div>
        <p className="tiny muted">Use it before class tomorrow: open the board on the TV, then tap the button. Nothing is sent to the board until you do.</p>
      </div>

      {P.focus ? <div className="note"><b>Big 5 focus for tomorrow:</b> {P.focus.name} (class average {P.focus.score}/100 in today’s evidence, the lowest of the five).</div> : null}

      <div className="g2">
        {c.boxes.map((b: { id: string; n: number; title: string }) => (
          <div key={b.id} className="card pad planbox" style={{ ['--bc' as string]: color(b.id) }}>
            <div className="ctlhead" style={{ marginBottom: 6 }}><span className="n" style={{ ['--bc' as string]: color(b.id), width: 28, height: 28, borderRadius: 8, fontSize: '.85em' }}>{b.n}</span><h3>{b.title}</h3></div>
            {P.boxes[b.id].map((l, i) => <div key={i} className="pline"><span className={'kind ' + l.kind}>{l.kind === 'same' ? 'Same' : l.kind === 'chg' ? 'Changed' : 'New'}</span>
              <div>{edit ? <input type="text" value={l.text} onChange={e => setLine(b.id, i, e.target.value)} /> : l.text}{l.why ? <span className="why">Why: {l.why}</span> : null}</div></div>)}
          </div>))}
      </div>

      <div className="g2">
        <div className="card pad stack sm"><h3>Groups for tomorrow</h3><p className="tiny muted">Readiness = 70% Big 5 composite + 30% the last four lessons (today included).</p>
          {(['adv', 'pro', 'beg'] as Group[]).map(g => <div key={g} className={'row g-' + g} style={{ gap: 8 }}><span className="pill gpill" style={{ minWidth: 104, justifyContent: 'center' }}>{GROUP_LABEL[g]}{g === 'adv' ? ' · they lead' : ''}</span>
            {P.groups[g].length ? P.groups[g].map(id => byId[id] ? <span key={id} className="row" style={{ gap: 5 }}><Avatar name={byId[id].name} />{byId[id].name}</span> : null) : <span className="muted small">—</span>}</div>)}
        </div>
        <div className="card pad stack sm"><h3>Family note</h3><p>{P.family}</p>
          <p className="tiny muted">Goes home in English and Spanish. Child-specific notes are on each child’s record.</p></div>
      </div>

      <div className="card pad stack sm"><h3>Each child tomorrow</h3>
        <div className="kids">{list.map(s => { const lines = P.kid[s.id] || []; const ch = childByName(s.name);
          return <Link key={s.id} href={`/child/?id=${s.id}`} className="card kid" style={{ textDecoration: 'none', color: 'inherit', boxShadow: 'none' }}>
            <span className="row" style={{ gap: 8 }}><Avatar name={s.name} /><b style={{ color: 'var(--navy)' }}>{s.name}</b>{ch ? <span className="tiny muted">{ch.tag}</span> : null}</span>
            {lines.length ? <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul> : <span className="small muted">Same routine as today.</span>}</Link>; })}</div>
      </div>
    </div>);
}
