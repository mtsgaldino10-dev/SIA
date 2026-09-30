import React from 'react';
const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
export function formatarQtd(v) { return v === null || v === undefined || v === '' ? '—' : nf.format(Number(v)); }
/** Quantidade em mono tabular, vírgula decimal, unidade em cinza. sinal: +2,5 · −1 */
export function Qtd({ valor, unidade, sinal = false }) {
  const n = Number(valor);
  const txt = sinal && valor !== null && valor !== undefined ? (n === 0 ? '0' : (n < 0 ? '−' : '+') + nf.format(Math.abs(n))) : formatarQtd(valor);
  return (
    <span style={{ fontFamily: 'var(--fonte-mono)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {txt}{unidade && valor !== null && valor !== undefined ? <span style={{ color: 'var(--texto-2)' }}> {unidade}</span> : null}
    </span>
  );
}
