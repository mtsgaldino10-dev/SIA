import React, { useState } from 'react';
const V = {
  primario: { n: { background: 'var(--cor-marca)', color: 'var(--cor-fundo)' }, h: { background: 'var(--marca-hover)' } },
  secundario: { n: { background: 'transparent', color: 'var(--cor-estrutura)', borderColor: 'var(--borda-forte)' }, h: { borderColor: 'var(--cor-estrutura)' } },
  perigo: { n: { background: 'transparent', color: 'var(--st-alerta-texto)', borderColor: 'var(--st-alerta)' }, h: { background: 'var(--st-alerta-fundo)' } },
  fantasma: { n: { background: 'transparent', color: 'var(--texto-2)', paddingLeft: 8, paddingRight: 8 }, h: { color: 'var(--cor-estrutura)' } },
};
/** Botão com verbo: "Enviar pedido", "Registrar recebimento". */
export function Botao({ variante = 'primario', tamanho = 'normal', disabled = false, largo = false, href, onClick, type = 'button', children }) {
  const [h, setH] = useState(false);
  const v = V[variante] || V.primario;
  const peq = tamanho === 'peq';
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} type={href ? undefined : type} disabled={disabled} onClick={disabled ? undefined : onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={Object.assign({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: peq ? 32 : 42, padding: peq ? '4px 10px' : '8px 16px', borderRadius: 'var(--raio)', border: '1px solid transparent', font: '600 ' + (peq ? '0.85rem' : '0.95rem') + ' var(--fonte)', cursor: disabled ? 'not-allowed' : 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', opacity: disabled ? 0.55 : 1, width: largo ? '100%' : undefined }, v.n, peq && variante === 'fantasma' ? { paddingLeft: 8, paddingRight: 8 } : null, h && !disabled ? v.h : null)}>
      {children}
    </Tag>
  );
}
