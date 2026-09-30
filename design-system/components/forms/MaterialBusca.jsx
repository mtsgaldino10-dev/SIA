import React, { useState } from 'react';
import { Campo } from './Campo.jsx';
import { Entrada } from './Entrada.jsx';
/** Busca de material por código SAP ou descrição, com lista flutuante. */
export function MaterialBusca({ rotulo = 'Adicionar material', materiais = [], onEscolher, aberta }) {
  const [t, setT] = useState('');
  const [sel, setSel] = useState(0);
  const q = t.trim().toLowerCase();
  const res = aberta || q ? materiais.filter((m) => !q || m.codigo_sap.includes(q) || m.descricao.toLowerCase().includes(q)).slice(0, 8) : [];
  return (
    <div style={{ position: 'relative' }}>
      <Campo rotulo={rotulo}><Entrada type="search" value={t} onChange={setT} placeholder="Código SAP ou descrição" /></Campo>
      {res.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 15, left: 0, right: 0, top: 'calc(100% + 4px)', background: 'var(--superficie)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio)', maxHeight: 320, overflowY: 'auto', boxShadow: 'var(--sombra-flutuante)' }}>
          {res.map((m, i) => (
            <button key={m.codigo_sap} onMouseEnter={() => setSel(i)} onClick={() => { onEscolher && onEscolher(m); setT(''); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: i === sel ? 'var(--marca-suave)' : 'none', border: 0, borderBottom: '1px solid var(--borda)', padding: '8px 12px', font: '400 0.92rem var(--fonte)', color: 'var(--texto)', cursor: 'pointer' }}>
              <span style={{ fontFamily: 'var(--fonte-mono)' }}>{m.codigo_sap}</span> · {m.descricao} <span style={{ color: 'var(--texto-2)' }}>({m.unidade})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
