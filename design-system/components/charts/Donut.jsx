import React from 'react';
const nf = new Intl.NumberFormat('pt-BR');
/** Donut com legenda (rótulo + valor em mono + %). */
export function Donut({ fatias, centro, legendaCentro, tamanho = 168, espessura = 22 }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  const r = (tamanho - espessura) / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: tamanho, height: tamanho, flex: 'none' }}>
        <svg width={tamanho} height={tamanho} viewBox={'0 0 ' + tamanho + ' ' + tamanho} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--st-neutro-fundo)" strokeWidth={espessura} />
          {fatias.map((f, i) => {
            const len = (f.valor / total) * c; const off = -acc; acc += len;
            return <circle key={i} cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={f.cor} strokeWidth={espessura} strokeDasharray={Math.max(len - 2, 0) + ' ' + c} strokeDashoffset={off} />;
          })}
        </svg>
        {centro !== undefined && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
            <div style={{ font: '400 1.9rem/1.1 var(--fonte-mono)', color: 'var(--cor-estrutura)' }}>{centro}</div>
            {legendaCentro && <div style={{ fontSize: '0.8rem', color: 'var(--texto-2)' }}>{legendaCentro}</div>}
          </div>
        )}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 160 }}>
        {fatias.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: f.cor, flex: 'none' }} />
            <span style={{ flex: 1 }}>{f.rotulo}</span>
            <span style={{ fontFamily: 'var(--fonte-mono)', fontVariantNumeric: 'tabular-nums' }}>{nf.format(f.valor)}</span>
            <span style={{ fontFamily: 'var(--fonte-mono)', color: 'var(--texto-2)', width: 44, textAlign: 'right' }}>{Math.round((f.valor / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
