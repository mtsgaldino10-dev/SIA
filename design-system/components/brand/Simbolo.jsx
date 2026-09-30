import React from 'react';
/** Símbolo Warefly: asa de três penas em arco ascendente (armazém que voa). */
export function Simbolo({ tamanho = 26, cor = 'var(--cor-marca)', cor2 = 'var(--cor-asa)' }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" style={{ flex: 'none' }}>
      <g fill="none" strokeLinecap="round">
        <path d="M4 21.5Q15 20 27.5 5" stroke={cor} strokeWidth="3.4" />
        <path d="M6.5 25.5Q16 25 24 15" stroke={cor2} strokeWidth="3.4" />
        <path d="M9.5 29Q16.5 29 20.5 23.5" stroke={cor2} strokeWidth="3.4" opacity="0.6" />
      </g>
    </svg>
  );
}
