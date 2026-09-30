import React, { useState } from 'react';
/** Item de lista em cartão (uso principal no celular). */
export function ItemLista({ titulo, direita, sub, subDireita, onClick, href }) {
  const [h, setH] = useState(false);
  const clicavel = !!(onClick || href);
  const Tag = href ? 'a' : clicavel ? 'button' : 'div';
  return (
    <Tag href={href} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'block', width: '100%', textAlign: 'left', font: 'inherit', background: 'var(--superficie)', border: '1px solid ' + (clicavel && h ? 'var(--borda-forte)' : 'var(--borda)'), borderRadius: 'var(--raio)', padding: '12px 14px', color: 'inherit', textDecoration: 'none', cursor: clicavel ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><span>{titulo}</span>{direita}</div>
      {(sub || subDireita) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 4, fontSize: '0.875rem' }}>
          <span>{sub}</span><span style={{ flex: 1 }} /><span style={{ color: 'var(--texto-2)' }}>{subDireita}</span>
        </div>
      )}
    </Tag>
  );
}
