'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { St, useRuntime, type Me } from '@/lib/runtime';
import { homeOf, ROLES, roleLabel } from '@/components/Shell';
import { Shapes, Toaster, toast, Wordmark } from '@/components/ui';

const STEPS = [
  ['Screen', 'Big 5 checklist three times a year, plus the lesson’s primary screen'],
  ['Teach', 'Drive the classroom board from the iPad, box by box'],
  ['Track', 'Every child, every box, live: as it happens in the lesson'],
  ['Adapt', 'Tomorrow’s plan built from today, ready on the board'],
];

export default function SignIn() {
  const rt = useRuntime(), router = useRouter();
  const [name, setName] = useState(''); const [role, setRole] = useState<Me['role'] | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (rt.ready) { const m = St().me(); if (m) { setName(m.name); setRole(m.role); } } }, [rt.ready]);
  if (!rt.ready) return <p className="empty">Loading…</p>;
  const st = St(), synced = st.mode === 'synced', member = synced ? st.member?.() : null;

  const local = (
    <div className="card pad stack">
      <h2>Who is using this iPad?</h2>
      <p className="muted small">Your name is saved with every score and note you record.</p>
      <label className="f">Your name<input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cari" autoComplete="off" /></label>
      <div className="f">What are you doing in the lesson?</div>
      <div className="rolegrid">
        {ROLES.map(r => <button type="button" key={r.id} className={'role' + (role === r.id ? ' on' : '')} onClick={() => setRole(r.id)} aria-pressed={role === r.id}><b>{r.label}</b><small>{r.d}</small></button>)}
      </div>
      <button className="btn pri big" type="button" onClick={() => {
        if (!name.trim() || !role) { toast('Add your name and pick a role'); return; }
        st.setMe({ name: name.trim(), role }); router.push(homeOf({ name, role }));
      }}>Continue</button>
      <button className="btn ghost" type="button" onClick={() => { if (!name.trim() || !role) { toast('Add your name and pick a role'); return; } st.setMe({ name: name.trim(), role }); router.push('/today/'); }}>Go to Today’s overview instead</button>
    </div>);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = e.currentTarget as HTMLFormElement & { e: HTMLInputElement; p: HTMLInputElement };
    setBusy(true); setErr('');
    st.signIn!(f.e.value.trim(), f.p.value).then(() => { const m = st.member?.(); if (m && m.role !== 'board') router.push(homeOf(st.me())); setBusy(false); },
      (x: Error) => { setBusy(false); setErr(x.message || 'Could not sign in'); });
  };
  const account = (
    <form className="card pad stack" onSubmit={submit}>
      <h2>Sign in</h2><p className="muted small">Use your DREAMS team account. This iPad stays signed in for the pilot.</p>
      <label className="f">Email<input type="email" name="e" autoComplete="username" required /></label>
      <label className="f">Password<input type="password" name="p" autoComplete="current-password" required /></label>
      <span className="small" style={{ color: 'var(--red)', minHeight: 18 }}>{err}</span>
      <button className="btn pri big" type="submit" disabled={busy}>Sign in</button>
    </form>);
  const signedIn = (
    <div className="card pad stack">
      <h2>{member ? `Signed in as ${member.name}` : 'Not on the team list'}</h2>
      <p className="muted small">{member?.role === 'board' ? 'This is the board account. Use it on the classroom TV only. Sign in here with your own account.'
        : member ? `Role: ${roleLabel(member.role)}. Your name and role come from the team list in Supabase.` : 'This account can sign in but isn’t on the team list yet. Ask Madeline to add it.'}</p>
      <div className="row">
        {member && member.role !== 'board' ? <button className="btn pri" type="button" onClick={() => router.push(homeOf(st.me()))}>Continue</button> : null}
        <button className="btn" type="button" onClick={() => st.signOut().then(() => router.refresh())}>Sign out</button>
      </div>
    </div>);

  return (
    <div className="landing">
      <div className="l">
        <span className="logochip"><Shapes /><Wordmark /></span>
        <div style={{ fontSize: '.75em', letterSpacing: '.14em', fontWeight: 700, opacity: .8 }}>DREAMS INCLUSIVE EARLY LEARNING FRAMEWORK™</div>
        <h1>Understand each child.<br />Know what to teach next.<br />See real progress.</h1>
        <p style={{ opacity: .9 }}>Bilingual Pre-K/K teaching that tracks every child live, feeds the Big 5, and prepares tomorrow.</p>
        <div className="steps4">{STEPS.map(([t, d], i) => <div key={t}><i>{i + 1}</i><span><b>{t}</b><small>{d}</small></span></div>)}</div>
      </div>
      <div className="r">
        <div className="tiny muted" style={{ fontWeight: 700, letterSpacing: '.08em' }}>UNIT 3 · WE HELP! · ¡AYUDAMOS! · DEC 1</div>
        {synced ? (st.needsSignIn?.() ? account : signedIn) : local}
        <p className="tiny muted">{synced ? 'Synced: every iPad and the board share live data.' : 'This device only: data stays in this browser. Connect Supabase in Setup to sync iPads.'}</p>
      </div>
      <Toaster />
    </div>
  );
}
