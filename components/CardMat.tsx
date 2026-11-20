'use client';
/* Student card mat: full screen, pictures only (no words, no scores), shuffled each time; press and hold to close. */
import { useEffect, useRef, useState } from 'react';
import { boardImg } from '@/lib/runtime';

export default function CardMat({ keys, onClose }: { keys: string[]; onClose: () => void }) {
  const [k] = useState(() => { const a = keys.slice(); for (let j = a.length - 1; j > 0; j--) { const x = Math.floor(Math.random() * (j + 1)); [a[j], a[x]] = [a[x], a[j]]; } return a; });
  const [down, setDown] = useState(false), t = useRef<ReturnType<typeof setTimeout>>(undefined), el = useRef<HTMLDivElement>(null);
  useEffect(() => { try { el.current?.requestFullscreen?.(); } catch { /* not allowed: stays as a full-window overlay */ } }, []);
  const close = () => { try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ignore */ } onClose(); };
  const cols = typeof window !== 'undefined' && innerWidth > innerHeight * 1.2 ? k.length : k.length === 4 ? 2 : Math.min(k.length, 3);
  const CARDS = window.WEHELP_CARDS;
  return (
    <div id="mat" ref={el}>
      <div className="cards" style={{ ['--cols' as string]: cols }}>
        {k.map(c => { const cd = CARDS[c] || { color: '#2E86D1', glyph: '', img: null };
          return <div key={c} className="mc" style={{ ['--cc' as string]: cd.color }}>{cd.img ? <img src={boardImg(cd.img)} alt="" /> : <svg viewBox="0 0 48 48" dangerouslySetInnerHTML={{ __html: cd.glyph }} />}</div>; })}
      </div>
      <button type="button" className={'hold' + (down ? ' down' : '')}
        onPointerDown={e => { e.preventDefault(); setDown(true); t.current = setTimeout(close, 1200); }}
        onPointerUp={() => { setDown(false); clearTimeout(t.current); }} onPointerLeave={() => { setDown(false); clearTimeout(t.current); }} onPointerCancel={() => { setDown(false); clearTimeout(t.current); }}>
        <i />Press and hold to close</button>
    </div>
  );
}
