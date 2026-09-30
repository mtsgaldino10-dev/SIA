import React from 'react';
export function Abas({ abas, ativa, onChange }) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--borda)', overflowX: 'auto' }}>
      {abas.map((a) => {
        const sel = a.id === ativa;
        return (
          <button key={a.id} role="tab" aria-selected={sel} onClick={() => onChange && onChange(a.id)}
            style={{ background: 'none', border: 0, borderBottom: '3px solid ' + (sel ? 'var(--cor-marca)' : 'transparent'), padding: '8px 12px', font: '500 0.95rem var(--fonte)', color: sel ? 'var(--cor-estrutura)' : 'var(--texto-2)', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            {a.rotulo}{a.contagem !== undefined ? <span style={{ fontFamily: 'var(--fonte-mono)', fontSize: '0.8rem', color: 'var(--texto-2)' }}>{a.contagem}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
