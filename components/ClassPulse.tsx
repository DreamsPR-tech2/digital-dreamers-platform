'use client';
/* Class panel: every child, live, through the lesson.
 * One row per child: here/not here, a dot per board box (✓ ◐ ○), primary screen status and stop-check marks.
 * The ✓ ◐ ○ buttons record the observation for the box that is up on the board right now; it is saved in the
 * shared store, so every iPad (and Results, Tomorrow, Big 5) sees it at once.
 */
import Link from 'next/link';
import { C, result, setField, St, students, type Obs, type Student } from '@/lib/runtime';
import { BOX_OBS, DOMAIN, domainOf } from '@/lib/big5';
import { fillBox, sampleReady } from '@/lib/sample';
import { Avatar, LevelPill, toast } from './ui';

const OBS: [Obs, string, string][] = [['ok', '✓', 'Independent'], ['sup', '◐', 'With support'], ['no', '○', 'Not yet']];

function QcMini({ s }: { s: Student }) {
  const r = result(s);
  if (!r.complete) { const n = 5 - r.missing.length; return <span className="qcmini">{n ? `QC ${n}/5` : 'QC –'}</span>; }
  return <span className="qcmini">{r.start_total}/15 <LevelPill L={r.start_level} pre="L" />{r.rescreen_needed && !r.rescreen_done ? <span className="pill re">2nd</span> : null}</span>;
}

export default function ClassPulse({ box, title = 'Class · live' }: { box: string | null; title?: string }) {
  const list = students(), boxes: { id: string; n: number; title: string }[] = C().boxes;
  const item = box ? BOX_OBS[box] : null, d = St().get();
  const rec = list.filter(s => box && s.obs?.[box]).length, here = list.filter(s => s.present !== false);
  const set = (s: Student, v: Obs) => setField(s.id, x => { const o = { ...(x.obs || {}) }; if (o[box!] === v) delete o[box!]; else o[box!] = v; x.obs = o; });
  return (
    <aside className="card pulse" aria-label="Class panel">
      <div className="ph stack sm">
        <div className="spread"><h3>{title}</h3>{item ? <span className="pill blue">{rec} of {here.length} recorded</span> : null}</div>
        {item ? <p className="small"><b>This box:</b> {item.label}{item.b5 ? <> · <span className="sw" style={{ background: domainOf(item.b5).color }} /> {DOMAIN[domainOf(item.b5).id].name}</> : <span className="muted"> · regulation (outside the Big 5)</span>}</p>
          : <p className="small muted">Move the board to a box to record it here.</p>}
      </div>
      <div>
        <div className="prow phead" aria-hidden="true">
          <span />
          <span>Child · boxes 1–8 · primary screen</span>
          {item ? <div className="obsbtns">{OBS.map(([k, ic, l]) => <span key={k} className={'obh ' + k}><b>{ic}</b>{l}</span>)}</div> : <span />}
        </div>
        {list.map(s => {
          const cur = box ? s.obs?.[box] : undefined, st = (s.stop || []).filter(Boolean);
          return (
            <div key={s.id} className={'prow' + (s.present === false ? ' away' : '')}>
              <Avatar name={s.name} />
              <div style={{ minWidth: 0 }}>
                <Link href={`/child/?id=${s.id}`} className="nm" style={{ textDecoration: 'none' }}><span>{s.name}</span>{s.present === false ? <span className="pill wait">not here</span> : null}</Link>
                <div className="row" style={{ gap: 8 }}>
                  <div className="dots" aria-label="Boxes">{boxes.map(b => <i key={b.id} className={(s.obs?.[b.id] || '') + (b.id === box ? ' cur' : '')} title={`${b.n} ${b.title}: ${s.obs?.[b.id] || 'not recorded'}`} />)}</div>
                  <QcMini s={s} />
                  {st.length ? <span className="qcmini">✋ {st.filter(v => v === 'Y').length}/{st.length}</span> : null}
                </div>
              </div>
              {item && s.present !== false ? (
                <div className="obsbtns" role="group" aria-label={`${s.name}: ${item.label}`}>
                  {OBS.map(([k, ic, l]) => <button key={k} type="button" className={'ob ' + k + (cur === k ? ' on' : '')} aria-pressed={cur === k} title={l} onClick={() => set(s, k)}>{ic}</button>)}
                </div>) : <span />}
            </div>);
        })}
      </div>
      {d.demo && box && sampleReady(d) ? (
        <div className="pad" style={{ paddingTop: 10, paddingBottom: 12 }}>
          <button type="button" className="btn ghost sm" onClick={() => { St().update(x => fillBox(x, box, St().now())); toast('Sample responses for this box'); }}>Fill sample responses for this box</button>
        </div>) : null}
    </aside>
  );
}
