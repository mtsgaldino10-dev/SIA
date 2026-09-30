import React from 'react';
export function Breadcrumb({ itens }) {
  return (
    <nav aria-label="Trilha" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: '0.875rem', color: 'var(--texto-2)' }}>
      {itens.map((it, i) => {
        const o = typeof it === 'string' ? { rotulo: it } : it;
        const ultimo = i === itens.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {o.onClick && !ultimo ? <button onClick={o.onClick} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}>{o.rotulo}</button> : <span style={{ color: ultimo ? 'var(--cor-estrutura)' : undefined, fontWeight: ultimo ? 500 : 400 }}>{o.rotulo}</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
