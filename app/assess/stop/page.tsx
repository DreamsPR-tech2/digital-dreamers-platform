'use client';
/* Stop check (classroom teacher): the pilot portal's Stop check tab, same fields and rules. */
import { useEffect, useRef, useState } from 'react';
import Shell from '@/components/Shell';
import AssessNav from '@/components/AssessNav';
import { C, setField, St, students, useRuntime, type Mark } from '@/lib/runtime';
import { Avatar } from '@/components/ui';

const HELP: [string, string][] = [['help_asked', 'Asked for help'], ['help_offered', 'Offered help'], ['support', 'Used support']];

export default function Page() { const rt = useRuntime(); return <Shell tab="assess">{rt.ready ? <Stop /> : null}</Shell>; }

function Stop() {
  const rt = useRuntime(), d = St().get(), list = students(), w = d.stop.watched, turn = d.stop.turn, turns = d.stop.turns, stops = d.activity.stops;
  const watched = list.filter(s => w.includes(s.id));
  // The number of stops follows the game (one per STOP the lesson lead calls); the teacher can add or remove stops.
  const [manual, setManual] = useState(false);
  const anyMarks = list.some(s => (s.stop || []).some(Boolean));
  const started = stops.length > 0 || anyMarks || manual;
  const removeLast = () => {
    const marked = list.some(s => (s.stop || [])[turns - 1]);
    if (marked && !confirm(`Remove stop ${turns}? Its Yes/No marks are cleared.`)) return;
    St().update(x => { x.stop.turns = Math.max(1, x.stop.turns - 1); x.stop.turn = Math.min(x.stop.turn, x.stop.turns);
      x.students.forEach(s => { if ((s.stop || []).length > x.stop.turns) s.stop = (s.stop || []).slice(0, x.stop.turns); }); });
  };
  // Follow the lesson lead: what is on the board right now, and jump to each new STOP as it is called.
  const c = C(), bs = rt.board, conn = rt.connected, onGame = conn && bs && c.boxes[(bs.cur || 1) - 1]?.id === 'move';
  const live = !!(onGame && bs?.signal === 'stop'), latest = stops.length;
  const seenStops = useRef(latest);
  useEffect(() => { // a new STOP was called: show it, even if this iPad was looking at an earlier stop
    if (latest > seenStops.current && d.stop.turn !== latest) St().update(x => { x.stop.turn = Math.min(latest, x.stop.turns); });
    seenStops.current = latest;
  }, [latest, d.stop.turn]);
  const place = bs?.place != null ? c.places[bs.place] : null;
  const status = !conn ? { cls: '', t: 'Board not open', s: 'Stops still appear here when the lesson lead presses STOP on the Lesson screen.' }
    : !onGame ? { cls: '', t: `The board is on part ${bs?.cur} · ${c.boxes[(bs?.cur || 1) - 1]?.title}`, s: 'The game is part 4. Pick the children to watch now; each STOP will open here.' }
    : bs?.phase === 'intro' ? { cls: 'go', t: 'Game starting: showing the four places', s: 'Get ready to watch your children.' }
    : bs?.phase === 'close' ? { cls: '', t: 'Game over: “Who helps here?”', s: 'Finish any blank marks, then add a note if needed.' }
    : bs?.spinning ? { cls: 'go', t: 'Spinning the wheel…', s: 'GO comes next.' }
    : live ? { cls: 'stop', t: `STOP${place ? ' at ' + place.landmark : ''}: mark stop ${latest} now`, s: 'Did each child freeze within about 3 seconds, in their own way?' }
    : bs?.signal === 'go' ? { cls: 'go', t: `GO${place ? ': going to ' + place.landmark : ''}`, s: 'Everyone is moving. Watch your children; STOP comes next.' }
    : { cls: 'go', t: 'Game on', s: 'Waiting for GO.' };
  let yes = 0, no = 0, moreYes = 0, seen = 0;
  watched.forEach(s => { let y = 0, n = 0; (s.stop || []).forEach(v => { if (v === 'Y') y++; if (v === 'N') n++; }); yes += y; no += n; if (y + n) { seen++; if (y > n) moreYes++; } });
  const pct = window.WeHelpScoring.stopPercent(yes, no);
  const at = stops.find(x => x.n === turn), atP = at && C().places.find((p: { id: string }) => p.id === at.place);
  const mark = (id: string, val: Mark) => setField(id, x => { const st = (x.stop || []).slice(); while (st.length < turn) st.push(null); st[turn - 1] = st[turn - 1] === val ? null : val; x.stop = st; });
  return (
    <div className="stack">
      <AssessNav current="stop" />
      <div className="spread"><p className="muted small">During “Let’s Explore Puerto Rico” · executive function (outside the Big 5). The same marks can be made on the Lesson screen right after each STOP.</p>
        <span className="pill">{yes + no ? `Yes on ${yes} of ${yes + no} marks · ${pct}%` : 'Nothing marked yet'}</span></div>
      <p className="note">Each time the leader says “Stop!”: did the child freeze within about 3 seconds, in their own way? <b>Yes</b> = stopped. <b>No</b> = kept going, or stopped only after a second cue or a touch. Leave it blank if they were away or you could not see. A blank is not a No.</p>
      <div className={'flowbar ' + status.cls} role="status" aria-live="polite"><b>{status.t}</b><span>{status.s}</span></div>
      <details className="card pad" open={!watched.length}><summary><b>Children to watch</b> <span className="muted small">({watched.length} chosen · 4–5 is enough)</span></summary>
        <div className="chips" style={{ marginTop: 10 }}>{list.map(s => <button key={s.id} type="button" className={'chip' + (w.includes(s.id) ? ' on' : '')}
          onClick={() => St().update(x => { const i = x.stop.watched.indexOf(s.id); if (i >= 0) x.stop.watched.splice(i, 1); else x.stop.watched.push(s.id); })}>{s.name}{s.present === false ? ' · not here' : ''}</button>)}</div></details>
      {watched.length && !started ? <div className="card pad stack sm"><b>No stops yet.</b><p className="small muted">Each time the lesson lead presses STOP in the game, a stop is added here (and on the Lesson screen), so you mark as many stops as the class plays.</p>
        <div className="row"><button type="button" className="btn" onClick={() => { St().update(x => { x.stop.turns = 1; x.stop.turn = 1; }); setManual(true); }}>Mark without the game: start stop 1</button></div></div> : null}
      {watched.length && started ? <>
        <div className="turnbar"><button type="button" className="btn" onClick={() => St().update(x => { x.stop.turn = Math.max(1, x.stop.turn - 1); })}>←</button>
          <span className="t">Stop {turn} of {turns}{atP ? ' · ' + atP.landmark : ''}</span>
          <button type="button" className="btn" onClick={() => St().update(x => { x.stop.turn = Math.min(x.stop.turns, x.stop.turn + 1); })}>Next stop →</button>
          <button type="button" className="btn ghost" onClick={() => St().update(x => { x.stop.turns = Math.min(20, x.stop.turns + 1); x.stop.turn = x.stop.turns; })}>+ Add a stop</button>
          {turns > 1 ? <button type="button" className="btn ghost" onClick={removeLast}>Remove stop {turns}</button> : null}</div>
        {latest && turn !== latest ? <button type="button" className="btn warn" onClick={() => St().update(x => { x.stop.turn = Math.min(latest, x.stop.turns); })}>Back to the latest stop ({latest})</button> : null}
        <div className="stopgrid">{watched.map(s => { const st = s.stop || [], v = st[turn - 1];
          return <div key={s.id} className={'srow' + (live && turn === latest && !v ? ' due' : '')}>
            <span className="row" style={{ gap: 8 }}><Avatar name={s.name} /><span className="nm">{s.name}</span></span>
            <div className="hist">{Array.from({ length: turns }, (_, i) => <span key={i} className={(st[i] || '') + (i === turn - 1 ? ' cur' : '')}>{st[i] || i + 1}</span>)}</div>
            <div className="yn"><button type="button" className={'btn y' + (v === 'Y' ? ' on' : '')} onClick={() => mark(s.id, 'Y')}>Yes · stopped</button><button type="button" className={'btn n' + (v === 'N' ? ' on' : '')} onClick={() => mark(s.id, 'N')}>No · kept going</button></div>
            <div className="snote"><div className="chips">{HELP.map(([k, l]) => <button key={k} type="button" className={'chip' + (s[k] ? ' on' : '')} onClick={() => setField(s.id, x => { if (x[k]) delete x[k]; else x[k] = St().now(); })}>{l}</button>)}
              <button type="button" className={'chip' + (s.game_engaged === true ? ' on' : '')} onClick={() => setField(s.id, x => { if (x.game_engaged === true) delete x.game_engaged; else x.game_engaged = true; })}>Engaged</button></div>
              <input type="text" defaultValue={s.game_note || ''} placeholder="Note (children never see this)" onChange={e => { const val = e.target.value; setField(s.id, x => { x.game_note = val; }); }} /></div>
          </div>; })}</div>
        <div className="card pad"><b>Class summary</b> · Children with more Yes than No: <b>{moreYes} of {seen}</b> watched
          {seen ? <p className="small" style={{ marginTop: 6 }}>{moreYes * 2 >= seen ? 'Mostly Yes: keep the routine and move on.' : 'Mostly No: play the stop-and-go part again tomorrow before adding a new skill.'} One session shows today’s response, not lasting gains.</p> : null}</div>
      </> : null}
    </div>);
}
