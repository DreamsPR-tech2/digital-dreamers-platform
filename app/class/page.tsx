'use client';
import Link from 'next/link';
import Shell from '@/components/Shell';
import B5Chart from '@/components/B5Chart';
import { result, students, useRuntime } from '@/lib/runtime';
import { childByName } from '@/lib/children';
import { BIG5, domainScore, groupOf, readiness, series, todayEvidence, type DomainId, type Group, GROUP_LABEL } from '@/lib/big5';
import { Avatar, GroupPill, LevelPill } from '@/components/ui';

export default function Page() { const rt = useRuntime(); return <Shell tab="class">{rt.ready ? <Class /> : null}</Shell>; }

function Class() {
  const list = students();
  const rows = list.map(s => { const c = childByName(s.name), ev = todayEvidence(s), sc = readiness(c, s); return { s, c, ev, sc, g: groupOf(sc) }; });
  const classSeries = Object.fromEntries(BIG5.map(d => [d.id, [0, 1, 2, 3].map(i => {
    const xs = rows.map(r => series(r.c, r.ev, d.id)[i]).filter((v): v is number => v !== null); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null; })])) as Record<DomainId, (number | null)[]>;
  const G: Record<Group, typeof rows> = { adv: [], pro: [], beg: [] }; rows.forEach(r => r.g && G[r.g].push(r));
  const noProfile = rows.filter(r => !r.c).length;
  return (
    <div className="stack">
      <div className="spread"><div><h1 style={{ fontSize: '1.6em' }}>My class</h1><p className="muted small">Each learner’s language, communication mode and supports are kept separate from performance.</p></div></div>
      {noProfile ? <p className="note">{noProfile} child{noProfile === 1 ? ' has' : 'ren have'} no history in the platform yet. Their Big 5 picture starts from today’s lesson evidence.</p> : null}
      <div className="g2" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}>
        <div className="card pad stack sm"><h3>Class Big 5 · Sep → Dec</h3><B5Chart data={classSeries} /><p className="tiny muted">December = today’s lesson evidence (hollow point), blended with November.</p></div>
        <div className="card pad stack sm"><h3>Groups</h3><p className="tiny muted">Readiness = 70% Big 5 composite + 30% last four lessons · Advanced ≥ 68 · Progressing 45–67 · Beginning &lt; 45</p>
          {(['adv', 'pro', 'beg'] as Group[]).map(g => <div key={g} className={'stack sm g-' + g} style={{ gap: 6 }}><span className="pill gpill" style={{ alignSelf: 'flex-start' }}>{GROUP_LABEL[g]} · {G[g].length}</span>
            <div className="row" style={{ gap: 10 }}>{G[g].map(r => <Link key={r.s.id} href={`/child/?id=${r.s.id}`} className="row" style={{ gap: 5, textDecoration: 'none', color: 'var(--navy)', fontWeight: 600 }}><Avatar name={r.s.name} />{r.s.name} <span className="muted small">{r.sc}</span></Link>)}</div></div>)}
        </div>
      </div>
      <div className="kids">{rows.map(({ s, c, ev, sc, g }) => { const r = result(s);
        return <Link key={s.id} href={`/child/?id=${s.id}`} className="card kid" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={s.name} lg /><div className="grow"><b style={{ color: 'var(--navy)', fontSize: '1.1em' }}>{s.name}</b>
            <div className="small muted">{c ? `${c.age} · ${c.tag}` : 'No profile yet'}</div></div><div style={{ textAlign: 'right' }}><GroupPill g={g} /><div className="tiny muted" style={{ marginTop: 3 }}>{sc ?? '–'} readiness</div></div></div>
          {c ? <div className="row" style={{ gap: 5 }}><span className="pill plum">{c.mode}</span><span className="pill">{c.home === 'es' ? 'Spanish at home' : c.home === 'en' ? 'English at home' : 'Bilingual home'}</span></div> : null}
          <div className="bars">{BIG5.map(d => { const v = domainScore(c, ev, d.id); return <div key={d.id} className="bar"><span>{d.id.toUpperCase()}</span><span className="tr"><i style={{ width: (v ?? 0) + '%', background: d.color }} /></span><span>{v ?? '–'}</span></div>; })}</div>
          <div className="row small" style={{ gap: 6 }}><span className="muted">Today:</span>{r.complete ? <><span className="pill">{r.start_total}/15</span><LevelPill L={r.start_level} /></> : <span className="pill wait">Not screened</span>}
            {s.present === false ? <span className="pill wait">not here</span> : null}{r.flags.length ? <span className="pill re">{r.flags.length} flag{r.flags.length > 1 ? 's' : ''}</span> : null}</div>
        </Link>; })}</div>
    </div>);
}
