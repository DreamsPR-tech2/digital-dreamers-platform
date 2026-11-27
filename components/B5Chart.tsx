'use client';
/* Big 5 progress, Sep → Dec: one line per domain, 0–100. December is today's lesson evidence blended with November;
 * a hollow point marks it as provisional. Missing months (e.g. not enrolled yet) leave a gap. */
import { BIG5, MONTHS, type DomainId } from '@/lib/big5';

export default function B5Chart({ data, h = 190 }: { data: Record<DomainId, (number | null)[]>; h?: number }) {
  const W = 480, P = { l: 30, r: 122, t: 12, b: 26 }, iw = W - P.l - P.r, ih = h - P.t - P.b;
  const x = (i: number) => P.l + (i / (MONTHS.length - 1)) * iw, y = (v: number) => P.t + ih - (v / 100) * ih;
  const ends: { id: DomainId; y: number; v: number }[] = [];
  BIG5.forEach(d => { const s = data[d.id]; const li = s.map((v, i) => (v === null ? -1 : i)).filter(i => i >= 0).pop(); if (li !== undefined) ends.push({ id: d.id, y: y(s[li]!), v: s[li]! }); });
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13; // keep labels apart
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${h}`} width="100%" role="img" aria-label="Big 5 progress by month">
      {[0, 50, 100].map(v => <g key={v}><line x1={P.l} x2={P.l + iw} y1={y(v)} y2={y(v)} stroke="#DCE3EA" strokeDasharray={v ? '3 4' : undefined} /><text x={P.l - 6} y={y(v) + 4} fontSize="10" textAnchor="end" fill="#687385">{v}</text></g>)}
      {MONTHS.map((m, i) => <text key={m} x={x(i)} y={h - 8} fontSize="11" textAnchor="middle" fill="#687385" fontWeight={i === 3 ? 700 : 500}>{m}</text>)}
      {BIG5.map(d => { const s = data[d.id]; let path = '', pen = false;
        s.forEach((v, i) => { if (v === null) { pen = false; return; } path += (pen ? 'L' : 'M') + x(i) + ' ' + y(v) + ' '; pen = true; });
        return <g key={d.id}><path d={path} fill="none" stroke={d.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          {s.map((v, i) => v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={i === 3 ? 4.5 : 3.2} fill={i === 3 ? '#fff' : d.color} stroke={d.color} strokeWidth="2"><title>{`${d.name} · ${MONTHS[i]}: ${v}`}</title></circle>)}</g>; })}
      {ends.map(e => { const d = BIG5.find(b => b.id === e.id)!; return <text key={e.id} x={P.l + iw + 8} y={e.y + 4} fontSize="10.5" fill={d.color} fontWeight="700">{d.name.split(' ')[0]} {e.v}</text>; })}
    </svg>);
}
