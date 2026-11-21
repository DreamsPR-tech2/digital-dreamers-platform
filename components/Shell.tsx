'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { St, summary, useRuntime, type Me } from '@/lib/runtime';
import { Ico, Shapes, Toaster, Wordmark } from './ui';

export const ROLES: { id: Me['role']; label: string; home: string; d: string }[] = [
  { id: 'lead', label: 'Lesson lead', home: '/lesson/', d: 'Drives the board · attendance, Brain Break, game, reader' },
  { id: 'screener', label: 'Screener', home: '/screen/', d: 'Quick Check one-to-one · second screen' },
  { id: 'teacher', label: 'Classroom teacher', home: '/stop/', d: 'Stop check during the game · class overview' },
  { id: 'tech', label: 'Tech support', home: '/results/', d: 'Results, sync and setup' },
];
export const homeOf = (m: Me | null) => ROLES.find(r => r.id === m?.role)?.home || '/today/';

type Tab = 'today' | 'lesson' | 'screen' | 'stop' | 'results' | 'tomorrow' | 'class' | 'big5' | 'setup' | 'signin';
const NAV: (readonly [Tab, string] | 'sep')[] = [
  ['today', 'Today'], 'sep', ['lesson', 'Lesson'], ['screen', 'Quick Check'], ['stop', 'Stop check'], 'sep',
  ['results', 'Results'], ['tomorrow', 'Tomorrow'], 'sep', ['class', 'Class'], ['big5', 'Big 5'],
];

function SyncPill() {
  const { status } = useRuntime();
  if (!status || status.mode === 'local') return <span className="sync local" title="Not connected to Supabase. Data stays on this device.">This device only</span>;
  let txt = 'Synced', cls = 'ok';
  if (!status.signedIn) { txt = 'Signed out'; cls = 'off'; }
  else if (status.error) { txt = 'Sync problem'; cls = 'err'; }
  else if (!status.online) { txt = 'Offline' + (status.pending ? ` · ${status.pending} waiting` : ''); cls = 'off'; }
  else if (status.pending) { txt = `Saving ${status.pending}…`; cls = 'busy'; }
  const title = (status.error ? status.error + '\n' : '') + (status.lastSync ? 'Last synced ' + new Date(status.lastSync).toLocaleTimeString() : '')
    + (status.pending ? '\nChanges are saved on this iPad and sent when the connection is back.' : '');
  return <span className={'sync ' + cls} title={title}>{txt}</span>;
}

/** Page frame. `gate`: the page needs a signed-in person (all lesson pages do). */
export default function Shell({ tab, children, gate = true }: { tab: Tab; children: ReactNode; gate?: boolean }) {
  const rt = useRuntime(), router = useRouter(), path = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ok = mounted && rt.ready;
  const st = ok ? St() : null, status = rt.status;
  const synced = st?.mode === 'synced';
  const member = synced ? st?.member?.() ?? null : null;
  const me = synced ? member : st?.me() ?? null;
  const needSignIn = ok && gate && (synced ? (!status?.signedIn || !member || member.role === 'board') : !me);
  useEffect(() => { if (needSignIn && !path.startsWith('/signin')) router.replace('/signin/'); }, [needSignIn, path, router]);

  let body: ReactNode = children;
  if (!ok) body = <p className="empty">Loading…</p>;
  else if (synced && !status?.ready) body = <p className="empty">Signing in…</p>;
  else if (needSignIn) body = <p className="empty">Opening sign-in…</p>;
  else if (gate && synced && !st!.get().session.id) body = <p className="empty">Loading the lesson…</p>;

  const re = ok && !needSignIn ? summary().rescreen_list.length : 0;
  const demo = ok && st!.get().demo;
  return (
    <>
      <header className="hdr noprint">
        <div className="in">
          <Link href="/today/" className="brand" aria-label="DREAMS home"><Shapes /><Wordmark /></Link>
          <nav className="nav" aria-label="Sections">
            {NAV.map((n, i) => n === 'sep' ? <span key={i} className="sep" /> :
              <Link key={n[0]} href={`/${n[0]}/`} className={tab === n[0] ? 'on' : ''}>
                {n[0] === 'lesson' && rt.connected ? <span className="live" title="Board connected" /> : null}
                {n[1]}{n[0] === 'screen' && re ? <span className="badge" title="Second screen waiting">{re}</span> : null}
              </Link>)}
          </nav>
          <div className="hright">
            {ok ? <SyncPill /> : null}
            <Link href="/signin/" className="me">{me ? <>{me.name} <small>· {ROLES.find(r => r.id === me.role)?.label || me.role}</small></> : 'Sign in'}</Link>
            <Link href="/setup/" className={'icnbtn' + (tab === 'setup' ? ' on' : '')} aria-label="Setup"><Ico n="gear" s={20} /></Link>
          </div>
        </div>
        {demo ? <div className="demobar">Demo roster · all 8 children and their data are fictional. Load the real roster in Setup before class.</div> : null}
      </header>
      <main className="main">{body}</main>
      <footer className="foot noprint">DREAMS Inclusive Early Learning Framework™ · All Access Academics, LLC · The board never shows scores; only first names at “Who is here?”.</footer>
      <Toaster />
    </>
  );
}
