'use client';
import Link from 'next/link';
import Shell, { canControlBoard } from '@/components/Shell';
import { C, St, students, summary, useRuntime, type Student } from '@/lib/runtime';
import { childByName, PAST_LESSONS } from '@/lib/children';
import { groupOf, readiness, type Group, BOX_OBS } from '@/lib/big5';
import { nextSchoolDay } from '@/lib/plan';
import { Avatar, GroupPill, Ico } from '@/components/ui';

export default function Page() { const rt = useRuntime(); return <Shell tab="today">{rt.ready ? <Today /> : null}</Shell>; }

const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

function watchList(list: Student[], sm: ReturnType<typeof summary>) {
  const out: { s: Student; why: string }[] = [];
  list.forEach((s, i) => {
    const r = sm.students[i], g = groupOf(readiness(childByName(s.name), s)), nots = Object.entries(s.obs || {}).filter(([, v]) => v === 'no').map(([b]) => BOX_OBS[b]?.short);
    if (r.rescreen_needed && !r.rescreen_done) out.push({ s, why: `Second screen open · items ${r.flagged_items.join(', ')}` });
    else if (nots.length >= 2) out.push({ s, why: `Not yet today: ${nots.join(', ')}` });
    else if (g === 'beg') out.push({ s, why: 'Beginning group · check in early' });
  });
  return out;
}

function Today() {
  const rt = useRuntime(), c = C(), d = St().get(), list = students(), sm = summary(), me = St().mode === 'synced' ? St().member?.() : St().me();
  const bs = rt.board, cur = bs?.cur || 0;
  const here = list.filter(s => s.present === true).length, marked = list.filter(s => s.present !== undefined).length;
  const obsN = list.reduce((a, s) => a + Object.keys(s.obs || {}).length, 0), obsMax = Math.max(1, list.filter(s => s.present !== false).length * c.boxes.length);
  const G: Record<Group, number> = { beg: 0, pro: 0, adv: 0 }; list.forEach(s => { const g = groupOf(readiness(childByName(s.name), s)); if (g) G[g]++; });
  const started = marked > 0 || obsN > 0 || sm.screened > 0;
  const tomorrow = nextSchoolDay(d.session.date);
  const watch = watchList(list, sm);
  const TL = [
    { k: 'done', when: 'Unit 1 · Oct', t: 'All About Me', s: 'Todo sobre mí · Sept. Big 5 checkpoint' },
    { k: 'done', when: 'Unit 2 · Nov 10', t: 'We Are Friends', s: 'Somos amigos · ' + PAST_LESSONS.length + ' lessons on record' },
    { k: 'now', when: 'Unit 3 · Today', t: 'We Help!', s: '¡Ayudamos! · Community Helpers' },
    { k: 'next', when: 'Next · ' + new Date(tomorrow + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), t: 'We Help! day 2', s: 'Built from today’s data' },
  ];
  return (
    <div className="stack">
      <div className="hero">
        <div><div className="hk">{fmt(d.session.date)} · {d.session.site}</div>
          <h1>Good morning{me?.name ? `, ${me.name}` : ''} <Ico n="sparkle" s={22} c="#FFC20E" fill /></h1>
          <p>Today is Unit 3 · We Help! Run the board from the iPad, record each child as you go, and tomorrow’s plan builds itself.</p></div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          {canControlBoard() ? <><Link href="/lesson/" className="btn red big"><Ico n="play" s={16} c="#fff" fill /> {started ? 'Continue the lesson' : 'Start the lesson'}</Link>
          <Link href="/assess/" className="btn white big"><Ico n="check" s={18} /> Assess</Link></>
          : <><Link href="/assess/" className="btn red big"><Ico n="check" s={18} c="#fff" /> Go to Assess</Link>
          <Link href="/lesson/" className="btn white big"><Ico n="play" s={16} fill /> Watch the lesson</Link></>}</div>
        <div className="deco"><span className="shapes lg"><i className="sq" /><i className="ci" /><i className="tr" /></span></div>
      </div>

      <div className="card pad"><div className="timeline">{TL.map(x => <div key={x.t + x.when} className={'tl ' + x.k}><span className="dot">{x.k === 'done' ? '✓' : ''}</span><small>{x.when}</small><b>{x.t}</b><span>{x.s}</span></div>)}</div></div>

      <div className="stats">
        <div className="stat" style={{ ['--tb' as string]: 'var(--red-soft)', ['--tc' as string]: '#B52A36' }}><span className="ic"><Ico n="people" s={24} /></span><div><small>Here today</small><b>{marked ? here : '–'} <em>/ {list.length}</em></b></div></div>
        <div className="stat"><span className="ic"><Ico n="check" s={24} /></span><div><small>Primary screen</small><b>{sm.screened} <em>/ {list.length}</em></b></div></div>
        <div className="stat" style={{ ['--tb' as string]: 'var(--teal-soft)', ['--tc' as string]: 'var(--teal-d)' }}><span className="ic"><Ico n="trend" s={24} /></span><div><small>Box observations</small><b>{Math.round((obsN / obsMax) * 100)}%</b></div></div>
        <div className="stat" style={{ ['--tb' as string]: 'var(--plum-soft)', ['--tc' as string]: '#5B389A' }}><span className="ic"><Ico n="board" s={24} /></span><div><small>Board</small><b style={{ fontSize: '1.05em' }}>{rt.connected ? `Box ${cur} · ${c.boxes[cur - 1]?.title}` : 'Not open'}</b></div></div>
        <div className="stat"><div style={{ width: '100%' }}><small>Groups (readiness)</small>
          <div className="row" style={{ gap: 6, marginTop: 4 }}>{(['adv', 'pro', 'beg'] as Group[]).map(g => <span key={g} className={'g-' + g}><GroupPill g={g} /> <b style={{ fontSize: '.95em' }}>{G[g]}</b></span>)}</div></div></div>
      </div>

      <div className="g2" style={{ gridTemplateColumns: 'minmax(260px,.8fr) minmax(0,1.6fr)' }}>
        <div className="card pad stack sm">
          <h3>Who to watch today</h3><p className="tiny muted">Automatic: second screen still open, two “not yet” today, or the Beginning group. Tap to open.</p>
          {watch.length ? watch.map(w => <Link key={w.s.id} href={`/child/?id=${w.s.id}`} className="row" style={{ textDecoration: 'none', padding: '8px 0', borderTop: '1px solid var(--line)', flexWrap: 'nowrap' }}>
            <Avatar name={w.s.name} /><span className="grow"><b style={{ color: 'var(--navy)' }}>{w.s.name}</b><br /><span className="small muted">{w.why}</span></span><span className="muted">›</span></Link>)
            : <p className="small muted">Nobody flagged yet.</p>}
        </div>
        <div className="card pad stack sm">
          <div className="spread"><div><span className="pill blue">Today’s lesson</span><h2 style={{ marginTop: 4 }}>{c.unit.title} <span className="muted" style={{ fontSize: '.6em', fontWeight: 600 }}>· {c.unit.titleEs}</span></h2>
            <p className="small muted">8 boxes on the classroom board · anchor sentence “{c.unit.anchor}” · Power Words: {c.words.map((w: { en: string }) => w.en).join(', ')}</p></div>
            <Link href="/tomorrow/" className="btn"><Ico n="calendar" s={17} /> Tomorrow’s plan</Link></div>
          <div className="stack sm" style={{ gap: 0 }}>{c.boxes.map((b: { id: string; n: number; title: string; es: string; color: string }) => {
            const n = list.filter(s => s.obs?.[b.id]).length, ok = list.filter(s => s.obs?.[b.id] === 'ok').length;
            return <div key={b.id} className="row" style={{ padding: '7px 0', borderTop: '1px solid var(--line)', flexWrap: 'nowrap' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: `var(--${b.color})`, color: '#fff', fontWeight: 800, display: 'grid', placeItems: 'center', fontSize: '.8em', flex: 'none' }}>{b.n}</span>
              <span className="grow"><b style={{ color: 'var(--navy)' }}>{b.title}</b> <span className="muted small">· {b.es} · {BOX_OBS[b.id]?.label}</span></span>
              {b.n === cur && rt.connected ? <span className="pill" style={{ background: 'var(--red)', color: '#fff' }}>On the board</span> : null}
              <span className="small muted" style={{ whiteSpace: 'nowrap' }}>{n ? `${ok}/${n} ✓` : '—'}</span></div>; })}</div>
        </div>
      </div>
    </div>);
}
