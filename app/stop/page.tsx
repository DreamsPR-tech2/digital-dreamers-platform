'use client';
/* Stop check (classroom teacher): the pilot portal's Stop check tab, same fields and rules. */
import { useEffect, useRef, useState } from 'react';
import Shell from '@/components/Shell';
import { C, setField, St, students, useRuntime, type Mark } from '@/lib/runtime';
import { Avatar } from '@/components/ui';

const HELP: [string, string][] = [['help_asked', 'Asked for help'], ['help_offered', 'Offered help'], ['support', 'Used support']];

export default function Page() { const rt = useRuntime(); return <Shell tab="stop">{rt.ready ? <Stop /> : null}</Shell>; }

function Stop() {
  const rt = useRuntime(), d = St().get(), list = students(), w = d.stop.watched, turn = d.stop.turn, turns = d.stop.turns, stops = d.activity.stops;
  const watched = list.filter(s => w.includes(s.id));
  // a STOP just called on the board → banner for 8 seconds
  const lastCall = useRef(0), was = useRef(false), [, tick] = useState(0);
  const sig = rt.board?.signal;
  useEffect(() => { if (sig === 'stop' && !was.current) { lastCall.current = Date.now(); setTimeout(() => tick(x => x + 1), 8100); } was.current = sig === 'stop'; }, [sig]);
  const called = sig === 'stop' && Date.now() - lastCall.current < 8000;
  let yes = 0, no = 0, moreYes = 0, seen = 0;
  watched.forEach(s => { let y = 0, n = 0; (s.stop || []).forEach(v => { if (v === 'Y') y++; if (v === 'N') n++; }); yes += y; no += n; if (y + n) { seen++; if (y > n) moreYes++; } });
  const pct = window.WeHelpScoring.stopPercent(yes, no);
  const at = stops.find(x => x.n === turn), atP = at && C().places.find((p: { id: string }) => p.id === at.place);
  const mark = (id: string, val: Mark) => setField(id, x => { const st = (x.stop || []).slice(); while (st.length < turn) st.push(null); st[turn - 1] = st[turn - 1] === val ? null : val; x.stop = st; });
  return (
    <div className="stack">
      <div className="spread"><div><h1 style={{ fontSize: '1.6em' }}>Stop check</h1><p className="muted small">During “Let’s Explore Puerto Rico” · executive function (outside the Big 5)</p></div>
        <span className="pill">{yes + no ? `Yes on ${yes} of ${yes + no} marks · ${pct}%` : 'Nothing marked yet'}</span></div>
      <p className="note">Each time the leader says “Stop!”: did the child freeze within about 3 seconds, in their own way? <b>Yes</b> = stopped. <b>No</b> = kept going, or stopped only after a second cue or a touch. Leave it blank if they were away or you could not see. A blank is not a No.</p>
      {called ? <div className="stopcall">STOP was just called{atP ? ` at ${atP.landmark}` : ''}. Mark stop {turn} now.</div> : null}
      <details className="card pad" open={!watched.length}><summary><b>Children to watch</b> <span className="muted small">({watched.length} chosen · 4–5 is enough)</span></summary>
        <div className="chips" style={{ marginTop: 10 }}>{list.map(s => <button key={s.id} type="button" className={'chip' + (w.includes(s.id) ? ' on' : '')}
          onClick={() => St().update(x => { const i = x.stop.watched.indexOf(s.id); if (i >= 0) x.stop.watched.splice(i, 1); else x.stop.watched.push(s.id); })}>{s.name}{s.present === false ? ' · not here' : ''}</button>)}</div></details>
      {watched.length ? <>
        <div className="turnbar"><button type="button" className="btn" onClick={() => St().update(x => { x.stop.turn = Math.max(1, x.stop.turn - 1); })}>←</button>
          <span className="t">Stop {turn} of {turns}{atP ? ' · ' + atP.landmark : ''}</span>
          <button type="button" className="btn" onClick={() => St().update(x => { x.stop.turn = Math.min(x.stop.turns, x.stop.turn + 1); })}>Next stop →</button>
          {turn === turns ? <button type="button" className="btn ghost" onClick={() => St().update(x => { x.stop.turns++; x.stop.turn = x.stop.turns; })}>+ Add a stop</button> : null}</div>
        <div className="stopgrid">{watched.map(s => { const st = s.stop || [], v = st[turn - 1];
          return <div key={s.id} className="srow">
            <span className="row" style={{ gap: 8 }}><Avatar name={s.name} /><span className="nm">{s.name}</span></span>
            <div className="hist">{Array.from({ length: turns }, (_, i) => <span key={i} className={(st[i] || '') + (i === turn - 1 ? ' cur' : '')}>{st[i] || i + 1}</span>)}</div>
            <div className="yn"><button type="button" className={'btn y' + (v === 'Y' ? ' on' : '')} onClick={() => mark(s.id, 'Y')}>Yes</button><button type="button" className={'btn n' + (v === 'N' ? ' on' : '')} onClick={() => mark(s.id, 'N')}>No</button></div>
            <div className="snote"><div className="chips">{HELP.map(([k, l]) => <button key={k} type="button" className={'chip' + (s[k] ? ' on' : '')} onClick={() => setField(s.id, x => { if (x[k]) delete x[k]; else x[k] = St().now(); })}>{l}</button>)}
              <button type="button" className={'chip' + (s.game_engaged === true ? ' on' : '')} onClick={() => setField(s.id, x => { if (x.game_engaged === true) delete x.game_engaged; else x.game_engaged = true; })}>Engaged</button></div>
              <input type="text" defaultValue={s.game_note || ''} placeholder="Note (children never see this)" onChange={e => { const val = e.target.value; setField(s.id, x => { x.game_note = val; }); }} /></div>
          </div>; })}</div>
        <div className="card pad"><b>Class summary</b> · Children with more Yes than No: <b>{moreYes} of {seen}</b> watched
          {seen ? <p className="small" style={{ marginTop: 6 }}>{moreYes * 2 >= seen ? 'Mostly Yes: keep the routine and move on.' : 'Mostly No: play the stop-and-go part again tomorrow before adding a new skill.'} One session shows today’s response, not lasting gains.</p> : null}</div>
      </> : null}
    </div>);
}
