'use client';
/* Lesson (lesson lead): drives the classroom board. Every control from the pilot portal's Lesson tab, unchanged in
 * behaviour (same board commands, same logs), with the live class panel next to it. */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Shell, { canControlBoard, leadOnly, NOT_LEAD } from '@/components/Shell';
import ClassPulse from '@/components/ClassPulse';
import { boardImg, boardUrl, C, meName, setField, St, students, summary, useRuntime, type BoardState, type LessonData } from '@/lib/runtime';
import { fillAll, sampleReady } from '@/lib/sample';
import { Avatar, fmtTime, Ico, toast } from '@/components/ui';

// Board commands: lesson lead only (Assess sees the screen and gets a message instead).
const send = (cmd: string, ...a: unknown[]) => { if (leadOnly()) St().board.send(cmd, ...a); };
// Taps on board controls are stopped before they change anything, for everyone but the lesson lead.
// Recording children (marked data-any: who stopped, sample data) stays open to Assess.
function guardBoard(e: React.MouseEvent) {
  if (canControlBoard()) return;
  const t = (e.target as HTMLElement).closest('button, a.btn, input, select');
  if (!t || t.closest('[data-any]')) return;
  e.preventDefault(); e.stopPropagation(); toast(NOT_LEAD);
}
const bi = (en: string, es: string) => <span className="bi"><b>{en}</b><i>{es}</i></span>;
const placeById = (id: string) => C().places.find((p: { id: string }) => p.id === id);
const bbName = (id: string) => C().brainBreaks.find((b: { id: string }) => b.id === id)?.en || id;

function GameTimeline({ act }: { act: LessonData['activity'] }) {
  const ev = [...act.draws.map(x => ({ at: x.at, t: '📍 ' + (placeById(x.place)?.landmark || x.place) })), ...act.stops.map(x => ({ at: x.at, t: '✋ Stop ' + x.n }))]
    .sort((a, b) => (a.at < b.at ? -1 : 1));
  return <span className="small">{ev.map((e, i) => <span key={i}>{i ? ' → ' : ''}{e.t} <span className="muted">{fmtTime(e.at)}</span></span>)}</span>;
}

/* "What is the date?": fill the answer in on the board piece by piece (weekday → month → day → year), or all at once. */
// The date controls always show. When the board isn't connected yet, the step is kept here and sent as soon as it connects.
let pendingDateStep: number | null = null;
function datePieces(bs: Partial<BoardState>) {
  if (bs.dateParts) return bs.dateParts;
  const d = new Date(St().get().session.date + 'T12:00:00'); // the session date, until the board reports its own
  return { weekday: d.toLocaleDateString('en-US', { weekday: 'long' }), month: d.toLocaleDateString('en-US', { month: 'long' }), day: d.getDate(), year: d.getFullYear() };
}
function DateSteps({ bs }: { bs: Partial<BoardState> }) {
  const { connected } = useRuntime();
  useEffect(() => { if (connected && pendingDateStep !== null) { send('setDateStep', pendingDateStep); pendingDateStep = null; } }, [connected]);
  const p = datePieces(bs);
  const step = !connected && pendingDateStep !== null ? pendingDateStep : bs.dateStep ?? (bs.dateShown ? 4 : 0);
  const [, rerender] = useState(0);
  const setStep = (n: number) => { if (connected) send('setDateStep', n); else { pendingDateStep = n; rerender(x => x + 1); } };
  const pieces: [string, string][] = [['Weekday', p.weekday], ['Month', p.month], ['Day', String(p.day)], ['Year', String(p.year)]];
  const next = step < 4 ? pieces[step] : null;
  return (
    <div className="stack sm">
      <div className="spread"><h3>What is the date?</h3><span className="pill">{step} of 4 filled in</span></div>
      <p className="small muted">{connected ? 'Ask the class one piece at a time. Each tap writes the next piece on the board.'
        : 'The board isn’t open yet. You can still fill the date in here; it appears on the board as soon as the board opens.'}</p>
      <div className="datesteps">{pieces.map(([k, v], i) => <button key={k} type="button" className={'dstep' + (i < step ? ' on' : i === step ? ' next' : '')} aria-pressed={i < step}
        onClick={() => setStep(i < step && i === step - 1 ? i : i + 1)}><small>{i + 1} · {k}</small><b>{v}</b></button>)}</div>
      <div className="row">
        {next ? <button type="button" className="btn pri big grow" onClick={() => setStep(step + 1)}>Next: {next[0].toLowerCase()} · {next[1]} →</button> : <span className="datebig grow">{`${p.weekday}, ${p.month} ${p.day}, ${p.year}`}</span>}
        {step < 4 ? <button type="button" className="btn" onClick={() => setStep(4)}>Fill in all</button> : null}
        {step > 0 ? <button type="button" className="btn ghost" onClick={() => setStep(0)}>Clear</button> : null}
      </div>
    </div>);
}

/* Right after STOP: mark which of the watched children stopped (same data as the Stop check tab). */
function WhoStopped({ bs }: { bs: Partial<BoardState> }) {
  const d = St().get(), list = students(), stops = d.activity.stops, n = stops.length;
  const watched = list.filter(s => d.stop.watched.includes(s.id));
  const toggleWatch = (id: string) => St().update(x => { const i = x.stop.watched.indexOf(id); if (i >= 0) x.stop.watched.splice(i, 1); else x.stop.watched.push(id); });
  const mark = (id: string, v: 'Y' | 'N') => setField(id, x => { const st = (x.stop || []).slice(); while (st.length < n) st.push(null); st[n - 1] = st[n - 1] === v ? null : v; x.stop = st; });
  const last = n ? stops[n - 1] : null, place = last ? placeById(last.place) : null, live = bs.signal === 'stop';
  const picker = <div className="chips">{list.map(s => <button key={s.id} type="button" className={'chip' + (d.stop.watched.includes(s.id) ? ' on' : '')} onClick={() => toggleWatch(s.id)}>{s.name}{s.present === false ? ' · not here' : ''}</button>)}</div>;
  return (
    <div className={'whostop' + (live ? ' live' : '')} data-any>
      <div className="spread"><h3>{last ? `Stop ${n}${place ? ' · ' + place.landmark : ''}: who stopped?` : 'Who stopped?'}</h3>{live ? <span className="pill no">STOP is on the board</span> : null}</div>
      {!watched.length ? <><p className="small muted">Pick 4–5 children to watch. After each STOP, mark whether each one froze within about 3 seconds, in their own way.</p>{picker}</>
        : !last ? <p className="small muted">Press STOP to start the first stop. Watching: {watched.map(s => s.name).join(', ')}.</p>
        : <div className="stack sm">{watched.map(s => { const v = (s.stop || [])[n - 1];
            return <div key={s.id} className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={s.name} /><b className="grow" style={{ color: 'var(--navy)' }}>{s.name}</b>
              <span className="yn"><button type="button" className={'btn y' + (v === 'Y' ? ' on' : '')} onClick={() => mark(s.id, 'Y')}>Yes · stopped</button><button type="button" className={'btn n' + (v === 'N' ? ' on' : '')} onClick={() => mark(s.id, 'N')}>No · kept going</button></span></div>; })}
            <p className="tiny muted">A blank is not a No: leave it if you could not see. These marks are the same ones on the Stop check tab.</p></div>}
      {watched.length ? <details><summary className="small">Change who you are watching ({watched.length})</summary><div style={{ marginTop: 8 }}>{picker}</div></details> : null}
    </div>);
}

function Controls({ bs }: { bs: Partial<BoardState> }) {
  const c = C(), d = St().get(), list = students(), sm = summary();
  const cur = bs.cur || 1, box = c.boxes[cur - 1];
  if (!box) return null;

  if (box.id === 'intro') {
    const here = list.filter(s => s.present === true).length, marked = list.filter(s => s.present === true || s.present === false).length, part = St().board.connected() ? bs.introPart || 'all' : 'all'; // no board yet: show both, so the date can still be filled in
    const setPresent = (id: string, v: boolean) => St().update(x => { const s = x.students.find(y => y.id === id); if (!s) return;
      if (s.present === v) { delete s.present; delete s.present_at; } else { s.present = v; s.present_at = St().now(); } });
    const show = (p: string) => part === 'all' || part === p;
    return <>
      <div className="stack sm"><h3>On the board</h3>
        <div className="seg" role="group" aria-label="What the open box shows">{[['attend', '1 · Who is here?'], ['date', '2 · Calendar'], ['all', 'Both']].map(([k, l]) =>
          <button key={k} type="button" className={'btn' + (part === k ? ' on' : '')} aria-pressed={part === k} onClick={() => send('setIntroPart', k)}>{l}</button>)}</div>
        {bs.open ? null : <p className="small muted">Tap “Open box full size” so the chosen part fills the board.</p>}</div>
      {show('attend') ? <div className="stack sm">
        <div className="spread"><h3>Who is here?</h3><span className="pill">{here} here · {marked} of {list.length} marked</span></div>
        <p className="small muted">Ask “Who is here?” and tap each child. Their first name is written onto the board’s list as you tap.</p>
        <div className="row"><button type="button" className="btn ghost sm" onClick={() => St().update(x => x.students.forEach(s => { if (s.present !== true) { s.present = true; s.present_at = St().now(); } }))}>Mark everyone here</button></div>
        <div className="attgrid">{list.map(s => <div key={s.id} className={'frow' + (s.present === true ? ' done' : s.present === false ? ' away' : '')}>
          <span className="nm">{s.name}</span><div className="row" style={{ gap: 6 }}>
            <button type="button" className={'fbtn' + (s.present === true ? ' on' : '')} aria-pressed={s.present === true} onClick={() => setPresent(s.id, true)}>Here</button>
            <button type="button" className={'fbtn' + (s.present === false ? ' on off' : '')} aria-pressed={s.present === false} onClick={() => setPresent(s.id, false)}>Not here</button></div></div>)}</div>
      </div> : null}
      {show('date') ? <DateSteps bs={bs} /> : null}
    </>;
  }
  if (box.id === 'ready') {
    const used = d.activity.brainBreaks, pick = (id: string) => {
      if (bs.bb !== id) St().update(x => { x.activity.brainBreaks.push({ id, at: St().now(), by: meName() }); });
      send('setBrainBreak', id);
    };
    return <>
      <h3>Pick a Brain Break for how the class is doing</h3>
      <div className="bbpick">{c.brainBreaks.map((b: { id: string; en: string; es: string; img: string; when: string; time: string }) =>
        <button type="button" key={b.id} className={'bbopt' + (bs.bb === b.id ? ' on' : '')} aria-pressed={bs.bb === b.id} onClick={() => pick(b.id)}>
          <img src={boardImg(b.img)} alt="" /><span>{bi(b.en, b.es)}<small>{b.when} · {b.time}</small></span></button>)}</div>
      <div className="row">{bs.bb ? <button type="button" className="btn ghost" onClick={() => send('setBrainBreak', '')}>Show all four again</button> : null}
        <a className="btn ghost" href={boardImg(c.brainBreakGuide)} target="_blank" rel="noopener">How to use (guide card) <Ico n="ext" s={15} /></a></div>
      {used.length ? <p className="small muted">Used today: {used.map(u => `${bbName(u.id)} at ${fmtTime(u.at)}`).join(' · ')}</p> : null}
    </>;
  }
  if (box.id === 'move') {
    const act = d.activity, phase = bs.phase || 'intro', spinning = !!bs.spinning, pl = bs.place != null ? c.places[bs.place] : null;
    const spin = () => {
      if (bs.spinning) return; const round = bs.round || [], left: number[] = [];
      for (let i = 0; i < c.places.length; i++) if (!round.includes(i) && i !== bs.place) left.push(i);
      if (!left.length) for (let i = 0; i < c.places.length; i++) if (i !== bs.place) left.push(i);
      const p = left[Math.floor(Math.random() * left.length)];
      St().update(x => { x.activity.draws.push({ place: c.places[p].id, at: St().now(), by: meName(), how: 'spin' }); });
      send('spin', p);
    };
    const showPlace = (i: number) => { St().update(x => { x.activity.draws.push({ place: c.places[i].id, at: St().now(), by: meName(), how: 'card' }); }); send('setPlace', i); };
    const signal = (sig: string) => {
      if (sig === 'stop' && bs.place != null && bs.signal !== 'stop') St().update(x => { const n = x.activity.stops.length + 1;
        x.activity.stops.push({ n, place: c.places[bs.place!].id, at: St().now(), by: meName() }); x.stop.turns = n === 1 ? 1 : Math.max(x.stop.turns, n); x.stop.turn = n; });
      send('signal', sig);
    };
    const say = pl ? (act.draws.length > 1 ? pl.goEn.replace(/^Go/, 'Next, go') : pl.goEn.replace(/^Go/, 'First, go')) : '';
    return <>
      <h3>{c.game.title} · Go and Stop</h3>
      <div className="seg" role="group" aria-label="Game part">{[['intro', '1 · Show the places'], ['play', '2 · Play'], ['close', '3 · Who helps here?']].map(([k, l]) =>
        <button key={k} type="button" className={'btn' + (phase === k ? ' on' : '')} onClick={() => send('gamePhase', k)}>{l}</button>)}</div>
      <button type="button" className="btn pri big" disabled={spinning} onClick={spin}>{spinning ? 'Spinning…' : 'Spin the wheel'}</button>
      <div className="nowcard">{spinning ? <span className="muted">The wheel is spinning…</span> : pl ? <><b>{pl.landmark}</b> · {pl.en}<br />
        <span className="small">Say: “{say}” · While going: {pl.move} {pl.how} · Helper: {pl.helper}</span></> : <span className="muted">Spin to pick the first place.</span>}</div>
      <div className="row">
        <button type="button" className="btn cue go" disabled={!pl} onClick={() => signal('go')}>GO</button>
        <button type="button" className="btn cue st" disabled={!pl} onClick={() => signal('stop')}>STOP</button></div>
      <p className="small muted">GO: everyone moves. STOP: everyone freezes. GO again to keep playing. Each STOP adds a stop to the stop check.</p>
      <WhoStopped bs={bs} />
      <details><summary className="small">Show a place without spinning (a student drew a paper card)</summary>
        <div className="chips" style={{ marginTop: 8 }}>{c.places.map((p: { landmark: string }, i: number) => <button key={i} type="button" className={'chip' + (bs.place === i ? ' on' : '')} onClick={() => showPlace(i)}>{p.landmark}</button>)}</div></details>
      {act.draws.length || act.stops.length ? <div className="gamelog"><b>Today so far</b> · {act.draws.length} place{act.draws.length === 1 ? '' : 's'}, {act.stops.length} stop{act.stops.length === 1 ? '' : 's'}<br /><GameTimeline act={act} /></div> : null}
    </>;
  }
  if (box.id === 'wall' || box.id === 'pep') {
    const isW = box.id === 'wall', items = isW ? c.words : c.letters, at = Math.max(0, Math.min(items.length - 1, (isW ? bs.word : bs.letter) || 0));
    const cmd = isW ? 'setWord' : 'setLetter';
    const label = (x: { en: string; L: string; word: string }) => (isW ? x.en : x.L + x.L.toLowerCase() + ' · ' + x.word);
    return <>
      <h3>{isW ? 'Power Word' : 'Letter'} {at + 1} of {items.length}: {label(items[at])}</h3>
      <div className="chips">{items.map((x: { en: string; L: string; word: string }, i: number) => <button key={i} type="button" className={'chip' + (i === at ? ' on' : '')} onClick={() => send(cmd, i)}>{i + 1} · {label(x)}</button>)}</div>
      <div className="row"><button type="button" className="btn" disabled={at === 0} onClick={() => send(cmd, Math.max(0, at - 1))}>← Previous</button>
        <button type="button" className="btn pri big grow" onClick={() => send('sayCurrent')}>Say it on the board</button>
        <button type="button" className="btn" disabled={at === items.length - 1} onClick={() => send(cmd, Math.min(items.length - 1, at + 1))}>Next →</button></div>
      <p className="small muted">The board computer says the English {isW ? 'word' : 'letter and word'} aloud. Its speakers need to be on, and the board needs one click or key press after it opens.</p>
    </>;
  }
  if (box.id === 'read') {
    const rec = sm.class_level, curL = bs.level || null;
    const choose = (L: number, src: string) => {
      let reason = '';
      if (src === 'override' && rec && L !== rec) { const r = prompt(`Teacher override: Level ${L} instead of the recommended Level ${rec}. Reason (saved in the log):`, ''); if (r === null) return; reason = r; }
      St().update(x => { x.levelLog.push({ at: St().now(), by: meName(), level: L, recommended: rec, source: L === rec ? 'quick check' : 'override', reason }); });
      send('setLevel', L, L === rec ? 'quick check' : 'override'); toast('Board set to Level ' + L);
    };
    return <>
      <h3>Reader level</h3>
      <p className="small">{rec ? <>The primary screen recommends <b>Level {rec}</b> ({sm.screened} screened · {[1, 2, 3].map(L => `L${L}: ${sm.level_counts[L as 1]}`).join(', ')}).</> : 'No screens saved yet.'} Board shows: <b>{curL ? 'Level ' + curL : 'no level'}</b>.</p>
      <div className="levelpick">{rec ? <button type="button" className="btn pri" onClick={() => choose(rec, 'quick check')}>Use Level {rec} from the primary screen</button> : null}
        {[1, 2, 3].map(L => <button key={L} type="button" className={'btn' + (curL === L ? ' on' : '') + (rec === L ? ' rec' : '')} onClick={() => choose(L, 'override')}>Level {L}</button>)}</div>
      <div className="row"><button type="button" className="btn" onClick={() => send('turn', -1)}>← Page</button><button type="button" className="btn" onClick={() => send('turn', 1)}>Page →</button></div>
    </>;
  }
  if (box.id === 'comp') {
    const order = window.WeHelpScoring.pickerOrder(list.map(St().toRec));
    return <>
      <h3>Who to call (second-screen students first)</h3>
      <div className="chips">{order.map(i => <span key={i} className={'chip' + (sm.students[i].rescreen_needed ? ' on' : '')}>{list[i].name}</span>)}</div>
      <div className="row"><button type="button" className="btn" onClick={() => send('seqUndo')}>Undo card</button><button type="button" className="btn pri" onClick={() => send('seqCheck')}>Check order</button>
        <button type="button" className="btn ghost" onClick={() => send('seqNew')}>New order</button></div>
    </>;
  }
  return <p className="small muted">The board shows the day’s plan. Point to each picture and say it together.</p>;
}

export default function Lesson() {
  const rt = useRuntime();
  return <Shell tab="lesson">{rt.ready ? <LessonBody /> : null}</Shell>;
}
function LessonBody() {
  const rt = useRuntime(), c = C(), bs: Partial<BoardState> = rt.board || {}, conn = rt.connected, cur = bs.cur || 1, box = c.boxes[cur - 1];
  const list = students(), here = list.filter(s => s.present === true).length, d = St().get();
  // the board writes on the first names of the children marked here, in the order they were marked, plus the count
  const names = list.filter(s => s.present === true).sort((a, b) => (a.present_at || '').localeCompare(b.present_at || '') || a.no - b.no).map(s => s.name);
  const lead = canControlBoard();
  useEffect(() => {
    const shown = bs.names || [];
    if (lead && conn && box?.id === 'intro' && (bs.here !== here || bs.total !== list.length || shown.join('|') !== names.join('|'))) send('setAttendance', here, list.length, names);
  });
  const note: [string, string] | undefined = box && c.notes[box.id];
  const color = (b: { color: string }) => `var(--${b.color})`;
  return (
    <div className="stack">
      <div className="spread">
        <div><div className="tiny muted" style={{ fontWeight: 700, letterSpacing: '.08em' }}>{c.unit.eyebrow.toUpperCase()} · {d.session.date}</div>
          <h1 style={{ fontSize: '1.6em' }}>{c.unit.title} <span className="muted" style={{ fontSize: '.6em', fontWeight: 600 }}>· {c.unit.titleEs}</span></h1></div>
        <div className="row"><span className={'conn' + (conn ? ' on' : '')}><i />{conn ? 'Board connected' : 'Board not open'}</span>
          <a className="btn navy" href={boardUrl()} target="dreams-platform-board"><Ico n="board" s={17} c="#fff" /> Open board</a></div>
      </div>
      {lead ? null : <p className="note viewonly"><b>You’re signed in as Assess.</b> You can see everything the lesson lead does here, but only the lesson lead controls the board. Record children in <Link href="/assess/">Assess</Link>.</p>}
      {conn ? null : <p className="note">Open the board on the classroom TV computer. {St().mode === 'synced' ? 'Sign it in with the board account; it then follows this iPad from any device.' : 'In this-device mode it must be another tab of this same browser.'}</p>}
      <div className="stack" style={{ gap: 14 }} onClickCapture={guardBoard}>
      <div className="boxes">{c.boxes.map((b: { id: string; n: number; title: string; color: string }) => {
        const n = list.filter(s => s.obs?.[b.id]).length, p = list.length ? Math.round((n / list.filter(s => s.present !== false).length || 0) * 100) : 0;
        return <button key={b.id} type="button" className={'bx' + (b.n === cur ? ' on' : b.n < cur ? ' done' : '')} style={{ ['--bc' as string]: color(b) }} onClick={() => send('goto', b.n)}>
          <i>{b.n}</i><b>{b.title}</b><span className="fill"><i style={{ ['--p' as string]: Math.min(100, p) + '%' }} /></span></button>; })}</div>
      <div className="row">
        <button type="button" className="btn" onClick={() => send('back')}>← Back</button>
        <button type="button" className={'btn' + (bs.open ? '' : ' pri')} onClick={() => send(bs.open ? 'close' : 'open')}>{bs.open ? 'Close box' : 'Open box full size'}</button>
        <button type="button" className="btn warn" onClick={() => send('next')}>Done, next →</button>
        <button type="button" className="btn ghost" onClick={() => send('setFlow', bs.flow === false ? 1 : 0)}>Lesson flow on board: {bs.flow === false ? 'Off' : 'On'}</button>
        {d.demo && sampleReady(d) ? <button type="button" data-any className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => { St().update(x => fillAll(x, St().now())); toast('Sample lesson filled for the 8 demo children'); }}>Fill the whole sample lesson</button> : null}
      </div>
      </div>
      <div className="lessonlay">
        <div className="stack">
          <div className="card pad stack ctlcard" style={{ ['--bc' as string]: box ? color(box) : 'var(--blue)' }} onClickCapture={guardBoard}>
            <div className="ctlhead"><span className="n">{cur}</span><div className="grow"><h2>{box?.title}</h2><span className="muted small">{box?.es}{bs.open ? ' · open full size' : ''}</span></div></div>
            <Controls bs={bs} />
          </div>
          {note ? <div className="card pad"><h3>{note[0]}</h3><p className="small" style={{ marginTop: 6 }}>{note[1]}</p></div> : null}
        </div>
        <ClassPulse box={box?.id || null} />
      </div>
    </div>
  );
}
