import React, { useState } from 'react';
function Linha({ l, colunas, onLinha, ultima }) {
  const [h, setH] = useState(false);
  return (
    <tr onClick={onLinha ? () => onLinha(l) : undefined} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ cursor: onLinha ? 'pointer' : 'default' }}>
      {colunas.map((c) => (
        <td key={c.chave} style={{ padding: '9px 12px', textAlign: c.num ? 'right' : 'left', borderBottom: ultima ? 0 : '1px solid var(--borda)', verticalAlign: 'middle', whiteSpace: c.num ? 'nowrap' : undefined, fontFamily: c.mono || c.num ? 'var(--fonte-mono)' : undefined, fontVariantNumeric: 'tabular-nums', width: c.largura, background: onLinha && h ? 'var(--marca-suave)' : undefined }}>
          {c.render ? c.render(l) : l[c.chave]}
        </td>
      ))}
    </tr>
  );
}
export function Tabela({ colunas, linhas, chave = 'id', onLinha, alturaMax }) {
  return (
    <div style={{ overflowX: 'auto', overflowY: alturaMax ? 'auto' : undefined, maxHeight: alturaMax, border: '1px solid var(--borda)', borderRadius: 'var(--raio)', background: 'var(--superficie)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.chave} style={{ padding: '9px 12px', textAlign: c.num ? 'right' : 'left', borderBottom: '1px solid var(--borda)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--texto-2)', background: 'color-mix(in srgb, var(--cor-fundo) 70%, white)', whiteSpace: 'nowrap', position: alturaMax ? 'sticky' : undefined, top: 0 }}>{c.rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => <Linha key={l[chave] ?? i} l={l} colunas={colunas} onLinha={onLinha} ultima={i === linhas.length - 1} />)}
        </tbody>
      </table>
    </div>
  );
}
