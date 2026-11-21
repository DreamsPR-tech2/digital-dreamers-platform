'use client';
/* Assess: everything the assistant records, in one place. By part (default) · Primary screen · Stop check · Second screen. */
import Link from 'next/link';
import { C, St, students, summary } from '@/lib/runtime';

export type AssessView = 'parts' | 'primary' | 'stop' | 'second';

export default function AssessNav({ current }: { current: AssessView }) {
  const list = students(), sm = summary(), d = St().get();
  const here = list.filter(s => s.present !== false);
  const pending = sm.students.filter(r => r.complete && r.rescreen_needed && !r.rescreen_done).length;
  const obs = list.reduce((a, s) => a + Object.keys(s.obs || {}).length, 0), max = Math.max(1, here.length * C().boxes.length);
  const tabs: [AssessView, string, string, string][] = [
    ['parts', '/assess/', 'By part', `${Math.round((obs / max) * 100)}% recorded`],
    ['primary', '/assess/primary/', 'Primary screen', `${sm.screened} of ${list.length} screened`],
    ['stop', '/assess/stop/', 'Stop check', d.activity.stops.length ? `${d.activity.stops.length} stop${d.activity.stops.length === 1 ? '' : 's'} called` : 'no stops yet'],
    ['second', '/assess/second/', 'Second screen', pending ? `${pending} waiting` : sm.rescreen_list.length ? 'all done' : 'none yet'],
  ];
  return (
    <div className="stack sm">
      <div className="spread"><div><h1 style={{ fontSize: '1.6em' }}>Assess</h1>
        <p className="muted small">Everything the assistant records during the lesson. It saves to the same class data the lead and the results see.</p></div></div>
      <nav className="subnav" aria-label="Assess">
        {tabs.map(([k, href, label, sub]) => <Link key={k} href={href} className={current === k ? 'on' : ''} aria-current={current === k ? 'page' : undefined}>
          <b>{label}{k === 'second' && pending ? <span className="badge" style={{ marginLeft: 6 }}>{pending}</span> : null}</b><small>{sub}</small></Link>)}
      </nav>
    </div>);
}
