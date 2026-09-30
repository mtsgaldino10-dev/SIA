import React, { useState } from 'react';
import { estiloControle } from './Entrada.jsx';
export function Selecao({ value, onChange, opcoes, vazio }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={(e) => onChange && onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={Object.assign({}, estiloControle, f ? { outline: '2px solid var(--cor-marca)', outlineOffset: 1 } : { outline: 'none' })}>
      {vazio ? <option value="">{vazio}</option> : null}
      {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
    </select>
  );
}
