import React from 'react';
export function formatarDoc(prefixo, numero) { return prefixo + '-' + String(numero).padStart(6, '0'); }
/** Número de documento: PED-000123, REM-…, SAI-…, AJU-… em mono. */
export function Doc({ prefixo, numero, forte = false }) {
  return <span style={{ fontFamily: 'var(--fonte-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: forte ? 500 : 400 }}>{formatarDoc(prefixo, numero)}</span>;
}
