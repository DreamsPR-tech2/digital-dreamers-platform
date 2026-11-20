'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { childByName } from '@/lib/children';
import type { Group } from '@/lib/big5';
import { GROUP_LABEL } from '@/lib/big5';

/* ---------- toast ---------- */
export function toast(msg: string) { window.dispatchEvent(new CustomEvent('dreams-toast', { detail: msg })); }
export function Toaster() {
  const [m, setM] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => { setM((e as CustomEvent).detail); clearTimeout(t); t = setTimeout(() => setM(null), 2400); };
    window.addEventListener('dreams-toast', on); return () => window.removeEventListener('dreams-toast', on);
  }, []);
  return <div className={'toast' + (m ? ' show' : '')} role="status" aria-live="polite">{m}</div>;
}

export const LevelPill = ({ L, pre = 'Level' }: { L: number | null | undefined; pre?: string }) => (L ? <span className={'pill lv' + L}>{pre} {L}</span> : null);
export const GroupPill = ({ g }: { g: Group | null }) => (g ? <span className={'pill gpill g-' + g}>{GROUP_LABEL[g]}</span> : null);

export function Avatar({ name, lg }: { name: string; lg?: boolean }) {
  const c = childByName(name);
  return <span className={'av' + (lg ? ' lg' : '') + (c ? '' : ' none')} style={c ? { background: c.color } : undefined} aria-hidden="true">{name.slice(0, 1)}</span>;
}

const P: Record<string, ReactNode> = {
  people: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 13.6c2.8.2 5 2 5 4.9" /></>,
  check: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8l2 2 3-3M8 15h8" /></>,
  trend: <><path d="M3 17l6-6 4 4 7-8" /><path d="M14 7h6v6" /></>,
  book: <><path d="M4 5c3-1.5 6-1.5 8 .5 2-2 5-2 8-.5v14c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5z" /><path d="M12 5.5V20" /></>,
  board: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  sparkle: <path d="M12 2l2.6 6.9L22 9.3l-5.7 4.6L18.2 21 12 17.2 5.8 21l1.9-7.1L2 9.3l7.4-.4z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  play: <path d="M7 4l13 8-13 8z" />,
  ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
};
export function Ico({ n, s = 18, c = 'currentColor', fill }: { n: string; s?: number; c?: string; fill?: boolean }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={fill ? 'none' : c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>;
}
export const Shapes = ({ lg }: { lg?: boolean }) => <span className={'shapes' + (lg ? ' lg' : '')} aria-hidden="true"><i className="sq" /><i className="ci" /><i className="tr" /></span>;
export const Wordmark = () => <span className="wordmark" aria-label="DREAMS">{'DREAMS'.split('').map((l, i) => <span key={i}>{l}</span>)}</span>;
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export const fmtSecs = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
