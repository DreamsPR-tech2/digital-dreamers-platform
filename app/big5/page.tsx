'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { C, students, useRuntime } from '@/lib/runtime';
import { childByName } from '@/lib/children';
import { BIG5, BOX_OBS, currentStatus, domainScore, INDICATOR, levelOf, LEVELS, QC_B5, STATUS_ICON, todayEvidence, type B5Status } from '@/lib/big5';
import { Avatar } from '@/components/ui';

export default function Page() { const rt = useRuntime(); return <Shell tab="big5">{rt.ready ? <Big5 /> : null}</Shell>; }

const QC_LABEL: Record<string, string> = { a1: 'Quick Check 1 · point to the 5 words', a2: 'Quick Check 2 · say the action', a3: 'Quick Check 3 · 2-step direction', a4: 'Quick Check 4 · /h/ first sound', a5: 'Quick Check 5 · “We help!”', bonus: 'Quick Check bonus · “I see a ___”' };

function Big5() {
  const router = useRouter(), list = students(), c = C();
  const rows = list.map(s => { const ch = childByName(s.name), ev = todayEvidence(s); return { s, ch, ev, cur: currentStatus(ch, ev) }; });
  const feeds: { what: string; ind: string }[] = [
    ...c.boxes.filter((b: { id: string }) => BOX_OBS[b.id]?.b5).map((b: { id: string; n: number; title: string }) => ({ what: `Box ${b.n} · ${b.title}: ${BOX_OBS[b.id].label}`, ind: BOX_OBS[b.id].b5! })),
    ...Object.entries(QC_B5).map(([k, ind]) => ({ what: QC_LABEL[k], ind })),
  ];
  return (
    <div className="stack">
      <div><h1 style={{ fontSize: '1.6em' }}>Big 5 screening</h1>
        <p className="muted small" style={{ maxWidth: 860 }}>Checklist aligned to Head Start’s Big 5 for All and the ELOF. Instructional screening, not diagnostic: observational, strengths-based, oral-first. What was observed and the language of the response are recorded; language, volume and posture are never scored.</p></div>

      <div className="card pad stack sm">
        <div className="spread"><h3>Class · level by domain</h3><span className="tiny muted">Initial (Sept.) checkpoint + evidence from every lesson since · tap a child to open their checklist</span></div>
        <div style={{ overflowX: 'auto' }}><table className="b5grid"><thead><tr><th>Child</th>{BIG5.map(d => <th key={d.id}><span className="sw" style={{ background: d.color }} /> {d.name}</th>)}</tr></thead>
          <tbody>{rows.map(({ s, ch, ev }) => <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/child/?id=${s.id}`)}>
            <td className="nm"><span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><Avatar name={s.name} /><b style={{ color: 'var(--navy)' }}>{s.name}</b></span></td>
            {BIG5.map(d => { const v = domainScore(ch, ev, d.id), lv = levelOf(v), today = d.ind.some(i => ev[i.id]);
              return <td key={d.id} className={lv === null ? 'lvcn' : 'lvc' + lv} title={today ? 'Includes evidence from today' : ''}>{lv === null ? '—' : LEVELS[lv]}{today ? ' •' : ''}<div className="tiny" style={{ fontWeight: 600, opacity: .75 }}>{v ?? ''}</div></td>; })}</tr>)}</tbody></table></div>
        <p className="tiny muted">• = includes evidence from today’s lesson. Beginning &lt; 35 · Developing 35–59 · Proficient 60–84 · Advanced ≥ 85.</p>
      </div>

      <div className="g2">
        {BIG5.map(d => <div key={d.id} className="card pad stack sm" style={{ borderTop: `4px solid ${d.color}` }}>
          <div className="spread"><h3>{d.name}</h3><span className="tiny muted">{d.elof}</span></div>
          {d.ind.map(i => { const n: Record<B5Status, number> = { obs: 0, emg: 0, not: 0, nop: 0 }; let t = 0; rows.forEach(r => { n[r.cur[i.id]]++; if (r.ev[i.id]) t++; });
            return <div key={i.id} className="ind"><span className="small">{i.text}{t ? <><br /><span className="evtag">{t} with evidence today</span></> : null}</span>
              <span className="row small" style={{ gap: 8, flexWrap: 'nowrap', fontWeight: 700 }}>{(['obs', 'emg', 'not'] as B5Status[]).map(x => <span key={x} title={x} style={{ color: x === 'obs' ? 'var(--teal-d)' : x === 'emg' ? 'var(--gold)' : 'var(--ink-3)' }}>{STATUS_ICON[x]} {n[x]}</span>)}</span></div>; })}
        </div>)}
        <div className="card pad stack sm">
          <h3>How We Help! feeds the Big 5</h3>
          <p className="tiny muted">Recorded live during the lesson; no separate assessment needed. The best evidence per indicator counts. Stop check and Brain Break are executive function / regulation, kept outside the Big 5.</p>
          <div className="tablewrap"><table className="res"><tbody>{feeds.map(f => <tr key={f.what}><td className="small">{f.what}</td>
            <td className="small"><span className="sw" style={{ background: BIG5.find(b => b.id === f.ind.slice(0, 2))!.color }} /> {INDICATOR[f.ind].text}</td></tr>)}</tbody></table></div>
          <Link href="/lesson/" className="small">Go to the live lesson →</Link>
        </div>
      </div>
    </div>);
}
