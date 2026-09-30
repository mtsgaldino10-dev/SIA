import React from 'react';
/** Gatilho de busca global com atalho ⌘K. */
export function BuscaComando({ placeholder = 'Buscar documento ou material', atalho = '⌘K', escuro = false, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 36, padding: '6px 10px', borderRadius: 'var(--raio)', border: '1px solid ' + (escuro ? 'var(--menu-divisor)' : 'var(--borda-forte)'), background: escuro ? 'color-mix(in srgb, var(--cor-fundo) 6%, transparent)' : 'var(--superficie)', color: escuro ? 'var(--menu-grupo)' : 'var(--texto-2)', font: '400 0.875rem var(--fonte)', cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{placeholder}</span>
      <kbd style={{ font: '400 0.72rem var(--fonte-mono)', padding: '1px 6px', borderRadius: 4, border: '1px solid ' + (escuro ? 'var(--menu-divisor)' : 'var(--borda)'), color: 'inherit' }}>{atalho}</kbd>
    </button>
  );
}
