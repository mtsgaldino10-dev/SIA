import React from 'react';
import { Breadcrumb } from './Breadcrumb.jsx';
export function PaginaTopo({ titulo, sub, voltar, trilha, acoes }) {
  return (
    <div>
      {trilha && <div style={{ marginBottom: 8 }}><Breadcrumb itens={trilha} /></div>}
      {voltar && <button onClick={voltar.onClick} style={{ display: 'inline-block', marginBottom: 8, fontSize: '0.875rem', color: 'var(--texto-2)', background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}>← {voltar.rotulo}</button>}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--cor-estrutura)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{titulo}</h1>
          {sub && <p style={{ margin: '4px 0 0', color: 'var(--texto-2)' }}>{sub}</p>}
        </div>
        {acoes && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{acoes}</div>}
      </div>
    </div>
  );
}
