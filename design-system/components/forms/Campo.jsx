import React from 'react';
/** Rótulo + controle + ajuda/erro. */
export function Campo({ rotulo, ajuda, erro, children, style }) {
  return (
    <label style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }, style)}>
      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--texto)' }}>{rotulo}</span>
      {children}
      {erro ? <span style={{ fontSize: '0.8rem', color: 'var(--st-alerta-texto)' }}>{erro}</span> : ajuda ? <span style={{ fontSize: '0.8rem', color: 'var(--texto-2)' }}>{ajuda}</span> : null}
    </label>
  );
}
