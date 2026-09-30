import React from 'react';
/** Faixa de atenção: linha âmbar fina e arredondada para ajustes e divergências. */
export function Fita({ altura = 3 }) {
  return <div aria-hidden="true" style={{ height: altura, background: 'var(--st-transito)', borderRadius: 'var(--raio-pilula)' }} />;
}
