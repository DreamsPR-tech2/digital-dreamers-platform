'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { St, useRuntime } from '@/lib/runtime';

export default function Home() {
  const rt = useRuntime(), router = useRouter();
  useEffect(() => {
    if (!rt.ready) return;
    const st = St(), who = st.mode === 'synced' ? st.member?.() : st.me();
    router.replace(who ? '/today/' : '/signin/');
  }, [rt.ready, router]);
  return <p className="empty">Loading…</p>;
}
