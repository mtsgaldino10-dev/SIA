import React, { useState, useRef } from 'react';
const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
/** Gráfico de linha com grade horizontal, rótulos X e tooltip no hover. */
export function GraficoLinha({ series, rotulosX, altura = 220, unidade = '' }) {
  const [idx, setIdx] = useState(null);
  const ref = useRef(null);
  const W = 640, H = altura, pl = 36, pr = 12, pt = 12, pb = 26;
  const n = rotulosX.length;
  const max = Math.max.apply(null, series.flatMap((s) => s.valores)) * 1.15 || 1;
  const x = (i) => pl + (i / (n - 1)) * (W - pl - pr);
  const y = (v) => pt + (1 - v / max) * (H - pt - pb);
  const grade = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  function mover(e) {
    const b = ref.current.getBoundingClientRect();
    const rx = ((e.clientX - b.left) / b.width) * W;
    setIdx(Math.max(0, Math.min(n - 1, Math.round(((rx - pl) / (W - pl - pr)) * (n - 1)))));
  }
  return (
    <div style={{ position: 'relative' }}>
      <svg ref={ref} viewBox={'0 0 ' + W + ' ' + H} width="100%" height={H} preserveAspectRatio="none" onMouseMove={mover} onMouseLeave={() => setIdx(null)} style={{ display: 'block', overflow: 'visible' }}>
        {grade.map((g, i) => (
          <g key={i}>
            <line x1={pl} x2={W - pr} y1={y(g)} y2={y(g)} stroke="var(--borda)" strokeDasharray={i ? '3 4' : undefined} vectorEffect="non-scaling-stroke" />
            <text x={pl - 6} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--texto-2)" fontFamily="var(--fonte-mono)">{Math.round(g)}</text>
          </g>
        ))}
        {rotulosX.map((r, i) => (i % Math.ceil(n / 8) === 0 || i === n - 1) && <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--texto-2)" fontFamily="var(--fonte-mono)">{r}</text>)}
        {idx !== null && <line x1={x(idx)} x2={x(idx)} y1={pt} y2={H - pb} stroke="var(--cor-neutra)" vectorEffect="non-scaling-stroke" />}
        {series.map((s, si) => (
          <path key={si} d={s.valores.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ')} fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {idx !== null && (
        <div style={{ position: 'absolute', top: 0, left: 'calc(' + ((x(idx) / W) * 100) + '% + ' + (idx > n / 2 ? '-12px' : '12px') + ')', transform: idx > n / 2 ? 'translateX(-100%)' : 'none', background: 'var(--cor-estrutura)', color: 'var(--cor-fundo)', borderRadius: 'var(--raio)', padding: '8px 10px', fontSize: '0.8rem', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: 'var(--sombra-flutuante)' }}>
          <div style={{ fontFamily: 'var(--fonte-mono)', marginBottom: 4, color: 'color-mix(in srgb, #fff 75%, transparent)' }}>{rotulosX[idx]}</div>
          {series.map((s, si) => (
            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.cor }} /><span style={{ flex: 1 }}>{s.nome}</span>
              <span style={{ fontFamily: 'var(--fonte-mono)', marginLeft: 12 }}>{nf.format(s.valores[idx])}{unidade}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, fontSize: '0.85rem', color: 'var(--texto-2)' }}>
        {series.map((s, si) => <span key={si} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: s.cor }} />{s.nome}</span>)}
      </div>
    </div>
  );
}
