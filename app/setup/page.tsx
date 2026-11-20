'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Shell from '@/components/Shell';
import { St, students, useRuntime } from '@/lib/runtime';
import { toast } from '@/components/ui';

export default function Page() { const rt = useRuntime(); return <Shell tab="setup">{rt.ready ? <Setup /> : null}</Shell>; }

function Connection() {
  const router = useRouter(), st = St().status(), cfg = window.WEHELP_CONFIG || { supabaseUrl: '', sessionDate: '' };
  let fixed = false; try { fixed = !localStorage.getItem('wehelp-connect:v1') && !!cfg.supabaseUrl; } catch { /* ignore */ }
  const [url, setUrl] = useState(''), [key, setKey] = useState('');
  if (St().mode === 'synced') return (
    <div className="card pad stack sm"><h3>Sync</h3>
      <p className="small">Connected to <b>{cfg.supabaseUrl}</b> · lesson date {cfg.sessionDate}.<br />{st.pending ? `${st.pending} change(s) waiting to send. ` : 'Everything is sent. '}{st.lastSync ? `Last synced ${new Date(st.lastSync).toLocaleTimeString()}.` : ''}</p>
      <div className="row"><button type="button" className="btn" onClick={() => St().signOut().then(ok => { if (ok !== false) router.push('/signin/'); })}>Sign out</button>
        {fixed ? null : <button type="button" className="btn ghost" onClick={() => { if (!confirm('Disconnect this device from Supabase? It goes back to keeping data on this device only.')) return;
          St().signOut().then(ok => { if (ok === false) return; try { localStorage.removeItem('wehelp-connect:v1'); } catch { /* ignore */ } location.reload(); }); }}>Disconnect this device</button>}</div></div>);
  return (
    <div className="card pad stack sm"><h3>Sync</h3>
      <p className="small muted">This device keeps data to itself. To share data across all iPads and the board, connect it to the team’s Supabase project (Project Settings → API). It uses the same project and tables as the We Help! pilot.</p>
      <div className="g2"><label className="f">Project URL<input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" autoComplete="off" /></label>
        <label className="f">Anon public key<input type="text" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" /></label></div>
      <div className="row"><button type="button" className="btn pri" onClick={() => { const u = url.trim(), k = key.trim(); if (!/^https?:\/\//.test(u) || k.length < 20) { toast('Add the project URL and anon key'); return; }
        try { localStorage.setItem('wehelp-connect:v1', JSON.stringify({ url: u, key: k })); } catch { /* ignore */ } location.reload(); }}>Connect this device</button></div></div>);
}

function Setup() {
  const d = St().get();
  const [roster, setRoster] = useState(() => students().map(s => `${s.no}, ${s.name}`).join('\n'));
  const save = () => {
    const rows: [number, string][] = [], bad: number[] = [], seen: Record<string, 1> = {};
    roster.split('\n').forEach((line, i) => { line = line.trim(); if (!line) return; const m = /^(\d+)\s*[,.\t ]\s*(.+)$/.exec(line); if (!m || seen[m[1]]) { bad.push(i + 1); return; } seen[m[1]] = 1; rows.push([+m[1], m[2].trim()]); });
    if (bad.length) { toast(`Check line ${bad.join(', ')} (number, name; numbers can’t repeat)`); return; }
    St().replaceRoster(rows); toast(`Roster saved: ${rows.length} children`);
  };
  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <h1 style={{ fontSize: '1.6em' }}>Setup</h1>
      <div className="card pad stack sm"><h3>Session</h3><div className="g2">
        <label className="f">Date<input type="date" defaultValue={d.session.date} onChange={e => { const v = e.target.value; St().update(x => { x.session.date = v; }); toast('Date saved'); }} /></label>
        <label className="f">Classroom teacher<input type="text" defaultValue={d.session.teacher} onBlur={e => { const v = e.target.value.trim(); St().update(x => { x.session.teacher = v; }); toast('Saved'); }} /></label></div></div>
      <div className="card pad stack sm"><h3>Roster</h3><p className="small muted">One child per line: number, then first name. Scores stay with a child as long as the number and name don’t change. Children whose names match a platform profile show their history; anyone else starts fresh from today.</p>
        <textarea rows={10} value={roster} onChange={e => setRoster(e.target.value)} />
        <div className="row"><button type="button" className="btn pri" onClick={save}>Save roster</button></div></div>
      <Connection />
      <div className="card pad stack sm"><h3>Scores</h3><p className="small muted">{St().mode === 'synced' ? 'Clearing scores affects every device. The reader level log is kept.' : 'Everything is saved in this browser only.'}</p>
        <div className="row">
          <button type="button" className="btn" onClick={() => { if (confirm('Clear every score, observation, note and stop-check mark? The roster stays. This can’t be undone.')) { St().reset(true); toast('Scores cleared'); } }}>Clear all scores (keep roster)</button>
          <button type="button" className="btn ghost" onClick={() => { if (confirm('Replace the roster and all scores with the 8 fictional demo children?')) { St().reset(false); setRoster(students().map(s => `${s.no}, ${s.name}`).join('\n')); toast('Demo roster loaded'); } }}>Load demo roster</button></div></div>
    </div>);
}
