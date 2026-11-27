'use client';
/* Second screen: children at Level 1–2 who scored 0–1 on an item are rechecked on those items only.
 * Same rules as the pilot (scoring.js); results are performance on reassessed items, not whole-class growth. */
import Link from 'next/link';
import Shell from '@/components/Shell';
import AssessNav from '@/components/AssessNav';
import { St, students, summary, useRuntime } from '@/lib/runtime';
import { Avatar, LevelPill } from '@/components/ui';

export default function Page() { const rt = useRuntime(); return <Shell tab="assess">{rt.ready ? <Second /> : null}</Shell>; }

function Second() {
  const list = students(), sm = summary(), items = window.WEHELP_ITEMS;
  const order = window.WeHelpScoring.pickerOrder(list.map(St().toRec)).filter(i => sm.students[i].complete && sm.students[i].rescreen_needed);
  const waiting = order.filter(i => !sm.students[i].rescreen_done), done = order.filter(i => sm.students[i].rescreen_done);
  const notYet = list.filter((s, i) => !sm.students[i].complete).length;
  const row = (i: number) => { const s = list[i], r = sm.students[i];
    return <div key={s.id} className="card pad row" style={{ flexWrap: 'nowrap', gap: 12 }}>
      <Avatar name={s.name} />
      <div className="grow"><b style={{ color: 'var(--navy)' }}>{s.name}</b>
        <div className="small muted">{r.flagged_items.map(n => { const it = items.find(x => x.n === n)!; return `item ${n} · ${it.area} (scored ${String(s[it.key])})`; }).join(' · ')}</div></div>
      {r.rescreened ? <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><span className="pill">{r.start_total} → {r.end_total}</span><LevelPill L={r.end_level} />
        <span className={'pill ' + ((r.growth ?? 0) > 0 ? 'ok' : '')}>{(r.growth ?? 0) >= 0 ? '+' : ''}{r.growth}</span></span> : null}
      <Link href={`/assess/primary/?id=${s.id}&step=0&re=1`} className={'btn ' + (r.rescreen_done ? 'ghost' : 'warn')}>{r.rescreen_done ? 'Edit' : r.rescreened ? 'Continue' : 'Start'}</Link>
    </div>; };
  return (
    <div className="stack">
      <AssessNav current="second" />
      <p className="note">Rechecks only a Level 1–2 child’s low items (item 3 with 0–2 words, items 4–7 scored 0), at the end of the lesson. The result is performance on those items only, not whole-class growth; an unchanged score is still useful for tomorrow’s plan.</p>
      {notYet ? <p className="small muted">{notYet} child{notYet === 1 ? ' has' : 'ren have'} no finished primary screen yet, so they can’t be flagged. <Link href="/assess/primary/">Go to Primary screen →</Link></p> : null}
      <h3>Waiting ({waiting.length})</h3>
      {waiting.length ? <div className="stack sm">{waiting.map(row)}</div> : <p className="small muted">Nobody is waiting for a second screen.</p>}
      {done.length ? <><h3>Done ({done.length})</h3><div className="stack sm">{done.map(row)}</div></> : null}
    </div>);
}
