import React from 'react';
import { Simbolo } from './Simbolo.jsx';
export function Marca({ comNome = false, cor = 'inherit' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: cor }}>
      <Simbolo />
      <span>
        <span style={{ font: '600 1.35rem/1 var(--fonte)', letterSpacing: '-0.01em' }}>Warefly</span>
        {comNome && <span style={{ display: 'block', fontSize: '0.8rem', color: 'color-mix(in srgb, currentColor 70%, transparent)' }}>Gestão de almoxarifado</span>}
      </span>
    </span>
  );
}
