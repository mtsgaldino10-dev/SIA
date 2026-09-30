import React from 'react';
/** Mini-gráfico de linha para KPIs. */
export function Sparkline({ valores, cor = 'var(--cor-marca)', largura = 84, altura = 30 }) {
  const max = Math.max.apply(null, valores), min = Math.min.apply(null, valores), r = max - min || 1;
  const pts = valores.map((v, i) => [(i / (valores.length - 1)) * (largura - 4) + 2, altura - 3 - ((v - min) / r) * (altura - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const u = pts[pts.length - 1];
  return (
    <svg width={largura} height={altura} viewBox={'0 0 ' + largura + ' ' + altura} aria-hidden="true" style={{ flex: 'none', color: cor }}>
      <path d={d + ' L' + u[0].toFixed(1) + ' ' + altura + ' L2 ' + altura + ' Z'} fill="currentColor" opacity="0.1" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={u[0]} cy={u[1]} r="2.6" fill="currentColor" />
    </svg>
  );
}
