'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { C, flagText, St, students, summary, useRuntime } from '@/lib/runtime';
import { BIG5, todayDomainScore, todayEvidence, levelOf, LEVELS } from '@/lib/big5';
import { Avatar, fmtTime, LevelPill, toast } from '@/components/ui';

const HELP: [string, string][] = [['help_asked', 'Asked for help'], ['help_offered', 'Offered help'], ['support', 'Used support']];
const bbName = (id: string) => C().brainBreaks.find((b: { id: string }) => b.id === id)?.en || id;
const placeName = (id: string) => C().places.find((p: { id: string }) => p.id === id)?.landmark || id;

export default function Page() { const rt = useRuntime(); return <Shell tab="results">{rt.ready ? <Results /> : null}</Shell>; }

function Results() {
  const router = useRouter(), sm = summary(), list = students(), d = St().get(), act = d.activity;
  const here = list.filter(s => s.present === true).length, re = sm.students.filter(r => r.rescreened);
  const evs = list.map(s => todayEvidence(s));
  const dom = BIG5.map(b => { const xs = evs.map(e => todayDomainScore(e, b.id)).filter((x): x is number => x !== null);
    return { b, n: xs.length, a: xs.length ? Math.round(xs.reduce((p, q) => p + q, 0) / xs.length) : null }; });
  const csv = () => {
    const S = window.WeHelpScoring, text = S.toCSV(list.map(St().toRec), d.session.date), name = S.csvFileName(d.session.date);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    toast('Saved ' + name);
  };
  const ev = [...act.draws.map(x => ({ at: x.at, t: '📍 ' + placeName(x.place) })), ...act.stops.map(x => ({ at: x.at, t: '✋ Stop ' + x.n }))].sort((a, b) => (a.at < b.at ? -1 : 1));
  return (
    <div className="stack">
      <div className="spread"><div><h1 style={{ fontSize: '1.6em' }}>Today’s results</h1><p className="muted small">{d.session.site} · {d.session.date} · accuracy and support reported separately, always with the number of children.</p></div>
        <div className="row"><button type="button" className="btn" onClick={csv}>⬇ Export CSV (no names)</button><Link href="/tomorrow/" className="btn red">What do I teach tomorrow? →</Link></div></div>
      <div className="sumbox">
        <div className="stat"><small>Here today</small><b>{here}<em> of {list.length}</em></b></div>
        <div className="stat"><small>Screened</small><b>{sm.screened}<em> of {list.length}</em></b></div>
        <div className="stat"><small>Met target (8+)</small><b>{sm.target_met}<em> of {sm.screened}</em></b></div>
        <div className="stat"><small>Class level</small><b>{sm.class_level || '–'}</b></div>
        <div className="stat"><small>Levels 1 · 2 · 3</small><b>{sm.level_counts[1]} · {sm.level_counts[2]} · {sm.level_counts[3]}</b></div>
        <div className="stat"><small>Stop check</small><b>{sm.stop_percent === null ? '–' : sm.stop_percent + '%'}<em> {sm.stop_yes + sm.stop_no ? `${sm.stop_yes} of ${sm.stop_yes + sm.stop_no}` : ''}</em></b></div>
        <div className="stat"><small>Second screen</small><b>{re.length}<em> of {sm.rescreen_list.length} done</em></b></div>
      </div>
      <div className="g2">
        <div className="card pad stack sm"><h3>What to do tomorrow · Quick Check flags</h3>
          {sm.recommendations.length ? <div className="reco">{sm.recommendations.map(r => <div key={r.flag}>{flagText(r.flag)}{r.students ? <small> ({r.students} of {sm.screened} children)</small> : null}</div>)}</div> : <p className="muted small">No flags yet.</p>}
          {re.length ? <p className="small muted">Second-screen results are performance on reassessed items only, not whole-class growth.</p> : null}
          <Link href="/tomorrow/" className="small">See the full plan for tomorrow, box by box →</Link></div>
        <div className="card pad stack sm"><h3>Big 5 · evidence from today’s lesson</h3>
          {dom.map(({ b, n, a }) => <div key={b.id} className="bar" style={{ gridTemplateColumns: '1fr 120px 92px' }}>
            <span style={{ color: 'var(--navy)' }}><span className="sw" style={{ background: b.color }} /> {b.name}</span>
            <span className="tr"><i style={{ width: (a ?? 0) + '%', background: b.color }} /></span>
            <span>{a === null ? 'no evidence' : `${LEVELS[levelOf(a)!]} · ${n}`}</span></div>)}
          <p className="tiny muted">From the box observations and Quick Check items. Stop check and Brain Break are recorded outside the Big 5.</p></div>
      </div>
      <div className="card pad stack sm"><h3>Brain Break and game</h3>
        <p className="small"><b>Brain Break:</b> {act.brainBreaks.length ? act.brainBreaks.map(u => `${bbName(u.id)} (${fmtTime(u.at)}${u.by ? ', ' + u.by : ''})`).join(' · ') : 'none picked'}</p>
        <p className="small"><b>Game:</b> {ev.length ? ev.map((e, i) => <span key={i}>{i ? ' → ' : ''}{e.t} <span className="muted">{fmtTime(e.at)}</span></span>) : 'not played yet'}</p></div>
      <div className="tablewrap"><table className="res"><thead><tr><th>#</th><th>Child</th><th>Here</th><th>Boxes ✓</th><th>Start</th><th>Target</th><th>Start level</th><th>Engaged</th><th>2nd screen</th><th>End</th><th>End level</th><th>Change</th><th>Stop</th><th>Game notes</th></tr></thead>
        <tbody>{list.map((s, i) => { const r = sm.students[i], st = (s.stop || []).filter(Boolean), ob = Object.values(s.obs || {});
          return <tr key={s.id} className="click" onClick={() => router.push(`/child/?id=${s.id}`)}>
            <td>{s.no}</td><td><span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><Avatar name={s.name} /><b>{s.name}</b></span></td>
            <td>{s.present === true ? 'Yes' : s.present === false ? 'No' : ''}</td>
            <td className="n">{ob.length ? `${ob.filter(v => v === 'ok').length}/${ob.length}` : ''}</td>
            <td className="n">{r.complete ? r.start_total : '–'}</td>
            <td>{r.complete ? (r.target_met ? <span className="pill ok">Yes</span> : <span className="pill no">No</span>) : <span className="pill wait">{r.missing.length < 5 ? 'Missing ' + r.missing.join(',') : 'Not screened'}</span>}</td>
            <td><LevelPill L={r.start_level} /></td><td>{s.engaged === true ? 'Y' : s.engaged === false ? 'N' : ''}</td>
            <td>{r.rescreen_needed ? (r.rescreen_done ? <span className="pill ok">Done</span> : <span className="pill re">Items {r.flagged_items.join(',')}</span>) : null}</td>
            <td className="n">{r.rescreened ? r.end_total : ''}</td><td>{r.rescreened ? <LevelPill L={r.end_level} /> : null}</td><td className="n">{r.rescreened ? (r.growth! >= 0 ? '+' : '') + r.growth : ''}</td>
            <td className="n">{st.length ? `${st.filter(v => v === 'Y').length}/${st.length}` : ''}</td>
            <td className="small">{[...HELP.filter(([k]) => s[k]).map(([, l]) => l), ...(s.game_engaged ? ['Engaged'] : []), ...(s.game_note ? [`“${s.game_note}”`] : [])].join(' · ')}</td></tr>; })}</tbody></table></div>
      {d.levelLog.length ? <div className="card pad"><h3>Reader level log</h3><div className="log">{d.levelLog.map((l, i) => <div key={i}>{fmtTime(l.at)} · Level {l.level} · {l.source}{l.recommended ? ` (recommended ${l.recommended})` : ''}{l.reason ? ` · “${l.reason}”` : ''}{l.by ? ' · ' + l.by : ''}</div>)}</div></div> : null}
    </div>);
}
