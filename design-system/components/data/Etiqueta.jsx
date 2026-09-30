import React, { useState } from 'react';
import { Sparkline } from '../charts/Sparkline.jsx';
const COR = { alerta: 'var(--st-alerta)', transito: 'var(--st-transito)', ok: 'var(--st-ok)', info: 'var(--st-info)' };
/** Indicador: legenda com ponto de status, número grande, minigráfico opcional. */
export function Etiqueta({ valor, legenda, tom, compacta = false, serie, variacao, onClick, href }) {
  const [h, setH] = useState(false);
  const clicavel = !!(onClick || href);
  const Tag = href ? 'a' : clicavel ? 'button' : 'div';
  const cor = COR[tom] || 'var(--cor-marca)';
  return (
    <Tag href={href} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'block', width: '100%', textAlign: 'left', font: 'inherit', background: 'var(--superficie)', border: '1px solid ' + (clicavel && h ? 'var(--borda-forte)' : 'var(--borda)'), boxShadow: clicavel && h ? '0 4px 14px rgba(11,36,71,.08)' : 'var(--sombra-cartao)', transition: 'box-shadow .15s, border-color .15s', borderRadius: 'var(--raio-folha)', padding: compacta ? '12px 14px' : '16px 18px', color: 'inherit', textDecoration: 'none', cursor: clicavel ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: compacta ? '0.8rem' : '0.85rem', color: 'var(--texto-2)' }}><span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 999, background: cor, flex: 'none' }} />{legenda}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ font: '600 ' + (compacta ? '1.5rem' : '1.9rem') + '/1.1 var(--fonte)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', color: 'var(--cor-estrutura)' }}>{valor}</span>
            {variacao ? <span style={{ font: '500 0.75rem var(--fonte)', padding: '2px 8px', borderRadius: 999, background: 'var(--st-ok-fundo)', color: 'var(--st-ok-texto)' }}>{variacao}</span> : null}
          </div>
        </div>
        {serie && serie.length > 1 ? <Sparkline valores={serie} cor={cor} /> : null}
      </div>
    </Tag>
  );
}
