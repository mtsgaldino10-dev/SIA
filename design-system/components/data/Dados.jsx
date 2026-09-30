import React from 'react';
/** Lista de pares rótulo/valor (dl.dados). */
export function Dados({ itens }) {
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 16px', margin: 0 }}>
      {itens.map(([dt, dd], i) => (
        <React.Fragment key={i}>
          <dt style={{ color: 'var(--texto-2)', fontSize: '0.9rem' }}>{dt}</dt>
          <dd style={{ margin: 0 }}>{dd}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
