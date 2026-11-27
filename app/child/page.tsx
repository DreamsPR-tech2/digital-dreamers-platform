'use client';
/* Child record: profile & communication, supports, today live (boxes + primary screen + stop check), Big 5 checklist
 * with where each mark came from, progress Sep → Dec, last four lessons, and tomorrow's focus. */
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import B5Chart from '@/components/B5Chart';
import { C, result, setField, St, students, summary, useRuntime, type Student } from '@/lib/runtime';
import { flagText } from '@/lib/runtime';
import { childByName, PAST_LESSONS } from '@/lib/children';
import { BIG5, BOX_OBS, currentStatus, domainScore, groupOf, lastFour, levelOf, LEVELS, readiness, series, STATUS_ICON, STATUS_LABEL, todayEvidence, type B5Status, type DomainId } from '@/lib/big5';
import { generatePlan } from '@/lib/plan';
import { Avatar, GroupPill, LevelPill } from '@/components/ui';

export default function Page() { return <Shell tab="class"><Suspense fallback={null}><Child /></Suspense></Shell>; }

const OBS_L: Record<string, string> = { ok: '✓ Independent', sup: '◐ With support', no: '○ Not yet' };
const STATES: B5Status[] = ['obs', 'emg', 'not', 'nop'];

function Child() {
  const rt = useRuntime(), q = useSearchParams();
  const plan = useMemo(() => { if (!rt.ready) return null; const c = C(), sm = summary(), d = St().get();
    return generatePlan({ students: students(), results: sm.students, summary: sm, brainBreaksUsed: d.activity.brainBreaks.map(b => b.id),
      content: { boxes: c.boxes, words: c.words, letters: c.letters, brainBreaks: c.brainBreaks, sequenceCount: c.sequenceCount }, date: d.session.date }); }, [rt.ready, rt.v]);
  if (!rt.ready) return null;
  const s = St().student(q.get('id') || '');
  if (!s) return <div className="empty">This child isn’t on the roster. <Link href="/class/">Back to my class</Link></div>;
  return <Record s={s} focus={plan?.kid[s.id] || []} />;
}

function Record({ s, focus }: { s: Student; focus: string[] }) {
  const c = childByName(s.name), r = result(s), ev = todayEvidence(s), cur = currentStatus(c, ev), sc = readiness(c, s), g = groupOf(sc);
  const boxes = C().boxes as { id: string; n: number; title: string; color: string }[];
  const data = Object.fromEntries(BIG5.map(d => [d.id, series(c, ev, d.id)])) as Record<DomainId, (number | null)[]>;
  const l4 = lastFour(c, s), labels = [...PAST_LESSONS.map(p => p.date), 'Today'].slice(-l4.length);
  const mark = (ind: string, st: B5Status) => setField(s.id, x => { const b = { ...(x.b5 || {}) }; if (b[ind] === st) delete b[ind]; else b[ind] = st; x.b5 = b; });
  const st = (s.stop || []).filter(Boolean);
  return (
    <div className="stack">
      <div className="row"><Link href="/class/" className="btn ghost sm">← My class</Link></div>
      <div className="card pad row" style={{ gap: 16, flexWrap: 'nowrap' }}>
        <Avatar name={s.name} lg />
        <div className="grow"><h1 style={{ fontSize: '1.6em' }}>{s.name}</h1>
          <p className="muted small">{c ? `Age ${c.age} · ${c.tag} · ${c.mode}${c.joined ? ` · joined in ${c.joined}` : ''}` : `#${s.no} · no profile or history in the platform yet`}</p></div>
        <div style={{ textAlign: 'right' }}><GroupPill g={g} /><div className="small muted" style={{ marginTop: 4 }}>Readiness {sc ?? '–'}</div></div>
      </div>

      <div className="g3">
        <div className="card pad stack sm"><h3>Profile &amp; communication</h3>
          {c ? <><p className="small"><b>Home language:</b> {c.home === 'es' ? 'Spanish' : c.home === 'en' ? 'English' : 'Spanish and English'}</p>
            <p className="small"><b>Responds by:</b> {c.mode}</p><p className="small"><b>Strengths:</b> {c.strengths}</p></> : <p className="small muted">Add a profile once the data and privacy setup is in place.</p>}</div>
        <div className="card pad stack sm"><h3>Supports &amp; accommodations</h3>
          {c ? <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{c.supports.map(x => <li key={x}>{x}</li>)}</ul> : <p className="small muted">—</p>}</div>
        <div className="card pad stack sm" style={{ borderTop: '4px solid var(--red)' }}><h3>For tomorrow</h3>
          {focus.length ? <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{focus.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="small muted">Same routine as today.</p>}
          {c ? <p className="small" style={{ marginTop: 4 }}><b>Family note:</b> {c.family}</p> : null}</div>
      </div>

      <div className="card pad stack sm">
        <div className="spread"><h3>Today · We Help!</h3><span className="small muted">{s.present === true ? 'Here' : s.present === false ? 'Not here' : 'Attendance not taken'}{s.recorded_by ? ` · last recorded by ${s.recorded_by}` : ''}</span></div>
        <div className="boxes">{boxes.map(b => { const v = s.obs?.[b.id];
          return <div key={b.id} className="bx" style={{ ['--bc' as string]: `var(--${b.color})`, background: v === 'ok' ? 'var(--teal-soft)' : v === 'sup' ? 'var(--gold-soft)' : v === 'no' ? 'var(--no-soft)' : '#fff' }}>
            <i>{b.n}</i><b>{b.title}</b><span className="tiny muted">{v ? OBS_L[v] : 'Not recorded'}</span></div>; })}</div>
        <div className="row" style={{ gap: 8 }}>
          <span className="small"><b>Primary screen:</b></span>
          {r.complete ? <>{r.start_total !== null ? <span className="pill">{r.start_total}/9</span> : <span className="pill">Item {r.not_administered.join(', ')} not given</span>}
            {r.needs_teacher_level ? <span className="pill re">Teacher sets level</span> : <LevelPill L={r.start_level} />}
            {r.start_total === null ? null : r.target_met ? <span className="pill ok">Target met</span> : <span className="pill no">Target not yet</span>}
            {r.rescreen_needed ? (r.rescreen_done ? <span className="pill ok">2nd screen {r.start_total} → {r.end_total}</span> : <span className="pill re">2nd screen: items {r.flagged_items.join(', ')}</span>) : null}</>
            : <span className="pill wait">{r.missing.length < 5 ? `In progress · missing ${r.missing.join(', ')}` : 'Not screened'}</span>}
          <Link href={`/assess/primary/?id=${s.id}&step=${r.complete ? 7 : 0}`} className="small">Open the screen →</Link>
          {st.length ? <span className="small" style={{ marginLeft: 'auto' }}><b>Stop check:</b> Yes on {st.filter(v => v === 'Y').length} of {st.length}</span> : null}
        </div>
        {r.flags.length ? <div className="reco">{r.flags.map(f => <div key={f}>{flagText(f)}</div>)}</div> : null}
        {s.engagement_note || s.game_note ? <p className="small muted">{[s.engagement_note, s.game_note].filter(Boolean).map(n => `“${n}”`).join(' · ')}</p> : null}
      </div>

      <div className="g2" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}>
        <div className="card pad stack sm"><h3>Big 5 · Sep → Dec</h3><B5Chart data={data} />
          <p className="tiny muted">Sep = initial checkpoint · Oct–Nov = lessons on record · Dec = today’s evidence (hollow point).</p></div>
        <div className="card pad stack sm"><h3>Independence · last four lessons</h3>
          {l4.length ? <div className="stack sm">{l4.map((v, i) => <div key={i} className="bar" style={{ gridTemplateColumns: '56px 1fr 40px' }}><span>{labels[i]}</span><span className="tr"><i style={{ width: v + '%', background: labels[i] === 'Today' ? 'var(--red)' : 'var(--blue)' }} /></span><span>{v}%</span></div>)}</div>
            : <p className="small muted">No lessons on record yet.</p>}
          <div className="bars" style={{ marginTop: 6 }}>{BIG5.map(d => { const v = domainScore(c, ev, d.id), lv = levelOf(v);
            return <div key={d.id} className="bar" style={{ gridTemplateColumns: '1fr 80px 84px' }}><span style={{ color: 'var(--navy)' }}><span className="sw" style={{ background: d.color }} /> {d.name}</span>
              <span className="tr"><i style={{ width: (v ?? 0) + '%', background: d.color }} /></span><span>{lv === null ? '–' : LEVELS[lv]}</span></div>; })}</div>
        </div>
      </div>

      <div className="card pad stack sm">
        <div className="spread"><h3>Big 5 checklist</h3><span className="tiny muted">Initial (Sept.) checkpoint, updated by today’s lesson. Tap a mark to set it yourself; tap it again to clear.</span></div>
        <div className="g2">{BIG5.map(d => <div key={d.id}>
          <div className="row" style={{ gap: 8, margin: '6px 0' }}><span className="sw" style={{ background: d.color, width: 14, height: 14 }} /><b style={{ color: 'var(--navy)' }}>{d.name}</b><span className="tiny muted">{d.elof}</span></div>
          {d.ind.map(i => { const e = ev[i.id];
            return <div key={i.id} className="ind"><span className="small">{i.text}{e ? <><br /><span className="evtag">{e.source}</span></> : c && c.b5Sept[i.id] !== 'nop' ? <><br /><span className="tiny muted">Sept. checkpoint</span></> : null}</span>
              <span className="st" role="group" aria-label={i.text}>{STATES.map(x => <button key={x} type="button" className={x + (cur[i.id] === x ? ' on' : '')} title={STATUS_LABEL[x]} aria-pressed={cur[i.id] === x} onClick={() => mark(i.id, x)}>{STATUS_ICON[x]}</button>)}</span></div>; })}
        </div>)}</div>
        <p className="tiny muted">Instructional screening, not diagnostic. The language of the response is recorded, never scored. {Object.values(ev).filter(e => e.source !== 'Teacher observation').length} indicators have evidence from today; box observations: {Object.entries(s.obs || {}).map(([b, v]) => `${BOX_OBS[b]?.short} ${v === 'ok' ? '✓' : v === 'sup' ? '◐' : '○'}`).join(' · ') || 'none yet'}.</p>
      </div>
    </div>);
}
