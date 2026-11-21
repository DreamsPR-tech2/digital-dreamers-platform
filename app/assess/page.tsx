'use client';
/* By part (Assess default): every child × every part of the lesson, recorded as ✓ independent · ◐ with support · ○ not yet.
 * One column is in focus: by default the part on the board now, and its question is shown above the chart.
 * The focused column has the three choices as buttons; other reached parts are dropdowns; parts not reached are blank.
 * Tap a reached column's header to edit that part instead; "Catch up to live" goes back to the board's part.
 * Same data as the class panel on the Lesson screen (students.obs), so the lead and the assistant can both record. */
import Link from 'next/link';
import { useState } from 'react';
import Shell from '@/components/Shell';
import AssessNav from '@/components/AssessNav';
import { C, setField, students, useRuntime, type Obs, type Student } from '@/lib/runtime';
import { BOX_OBS, domainOf } from '@/lib/big5';

export default function Page() { const rt = useRuntime(); return <Shell tab="assess">{rt.ready ? <Parts /> : null}</Shell>; }

const OPTS: [Obs, string, string][] = [['ok', '✓', 'Independent'], ['sup', '◐', 'With support'], ['no', '○', 'Not yet']];
const ICON: Record<string, string> = { ok: '✓', sup: '◐', no: '○' };
const LABEL: Record<string, string> = { ok: 'independent', sup: 'with support', no: 'not yet' };
type Box = { id: string; n: number; title: string; color: string };
type Phase = 'focus' | 'done' | 'later';

function set(s: Student, box: string, v: Obs | '') {
  setField(s.id, x => { const o = { ...(x.obs || {}) }; if (v) o[box] = v; else delete o[box]; x.obs = o; });
}

function Cell({ s, b, phase }: { s: Student; b: Box; phase: Phase }) {
  const v = s.obs?.[b.id] || '', away = s.present === false;
  if (phase === 'later') return <span className="pcell later" aria-label={`${b.title}: not reached yet`} />;
  if (phase === 'focus') return (
    <div className="tri" role="group" aria-label={`${s.name}, ${b.title}`}>
      {OPTS.map(([k, ic, l]) => <button key={k} type="button" className={k + (v === k ? ' on' : '')} aria-pressed={v === k} title={l} disabled={away}
        onClick={() => set(s, b.id, v === k ? '' : k)}>{ic}</button>)}
    </div>);
  return (
    <label className={'psel ' + v + (away ? ' away' : '')} title={v ? LABEL[v] : 'Not recorded'}>
      <span aria-hidden="true">{ICON[v] || '—'}</span><i aria-hidden="true">▾</i>
      <select value={v} disabled={away} aria-label={`${s.name}, ${b.title}: ${v ? LABEL[v] : 'not recorded'}`} onChange={e => set(s, b.id, e.target.value as Obs | '')}>
        <option value="">— Not recorded</option>
        {OPTS.map(([k, ic, l]) => <option key={k} value={k}>{ic} {l}</option>)}
      </select>
    </label>);
}

function Parts() {
  const rt = useRuntime(), list = students(), boxes: Box[] = C().boxes;
  const live: number | null = rt.connected ? rt.board?.cur ?? null : null;
  const [picked, setPicked] = useState<number | null>(null);            // null = follow the board
  const reached = (n: number) => live === null || n <= live;
  const focus = picked !== null && reached(picked) && picked !== live ? picked : live ?? picked ?? 1;
  const following = focus === live;
  const phase = (b: Box): Phase => (b.n === focus ? 'focus' : reached(b.n) ? 'done' : 'later');
  const fb = boxes[focus - 1], q = BOX_OBS[fb.id], here = list.filter(s => s.present !== false);
  const rec = here.filter(s => s.obs?.[fb.id]).length;
  const pick = (n: number) => setPicked(n === live ? null : n);
  return (
    <div className="stack">
      <AssessNav current="parts" />
      <div className={'qcard' + (following ? ' live' : '')} style={{ ['--bc' as string]: `var(--${fb.color})` }}>
        <div className="qtop">
          <span className="n">{fb.n}</span>
          <span className="grow"><small>{following ? 'On the board now' : live ? `Editing part ${fb.n} · the board is on part ${live}` : `Part ${fb.n}`} · {fb.title}</small>
            <b>{q?.question}</b></span>
          <span className="pill blue">{rec} of {here.length} recorded</span>
          {live !== null && !following ? <button type="button" className="btn red" onClick={() => setPicked(null)}>Catch up to live · part {live}</button> : null}
        </div>
        <div className="legend"><span><b>✓</b>Independent</span><span><b>◐</b>With support</span><span><b>○</b>Not yet</span>
          <span className="muted">{q?.b5 ? `Counts toward ${domainOf(q.b5).name}` : 'Regulation (outside the Big 5)'}</span>
          <span className="muted">{live === null ? 'The board isn’t open: tap any column header to choose the part.' : 'Tap a column header to edit another part.'}</span></div>
      </div>
      <div className="card pad" style={{ overflowX: 'auto' }}>
        <table className="parts">
          <colgroup><col className="c-name" />{boxes.map(b => <col key={b.id} className={phase(b) === 'focus' ? 'c-now' : ''} />)}<col className="c-total" /></colgroup>
          <thead><tr><th className="nmh">Child</th>
          {boxes.map(b => <th key={b.id} className={phase(b) + (b.n === live ? ' live' : '')} title={BOX_OBS[b.id]?.question}>
            <button type="button" className="phead" disabled={!reached(b.n)} aria-pressed={b.n === focus} onClick={() => pick(b.n)}>
              <span className="n" style={{ background: `var(--${b.color})` }}>{b.n}</span><span className="t">{b.title}</span>
              {b.n === live ? <span className="nowtag">On the board</span> : null}</button></th>)}
          <th><span className="t">✓ total</span></th></tr></thead>
          <tbody>{list.map(s => { const vals = Object.values(s.obs || {});
            return <tr key={s.id}><td className="nm"><Link href={`/child/?id=${s.id}`}>{s.name}</Link>{s.present === false ? <small>not here</small> : null}</td>
              {boxes.map(b => <td key={b.id} className={'cell' + (b.n === focus ? ' fcol' : '')}><Cell s={s} b={b} phase={phase(b)} /></td>)}
              <td className="tot">{vals.length ? `${vals.filter(v => v === 'ok').length}/${vals.length}` : ''}</td></tr>; })}</tbody>
        </table>
      </div>
      <div className="card pad stack sm"><h3>The question for each part</h3>
        <div className="tablewrap"><table className="res"><tbody>{boxes.map(b => { const m = BOX_OBS[b.id];
          return <tr key={b.id}><td style={{ width: 170 }}><b>{b.n} · {b.title}</b></td><td className="small">{m?.question}</td>
            <td className="small muted">{m?.b5 ? <><span className="sw" style={{ background: domainOf(m.b5).color }} /> {domainOf(m.b5).name}</> : 'Regulation (outside the Big 5)'}</td></tr>; })}</tbody></table></div>
      </div>
    </div>);
}
