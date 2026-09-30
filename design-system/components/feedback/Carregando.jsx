import React from 'react';
export function Carregando({ texto = 'Carregando…' }) {
  return <div style={{ padding: 24, color: 'var(--texto-2)' }}>{texto}</div>;
}
