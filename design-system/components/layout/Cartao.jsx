import React from 'react';
function Mini({ children, onClick, rotulo }) {
  return <button onClick={onClick} aria-label={rotulo} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 30, padding: '3px 10px', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio)', background: 'transparent', font: '500 0.82rem var(--fonte)', color: 'var(--cor-estrutura)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>;
}
/** Cartão: superfície clara, borda aço 30%, raio 6px. Cabeçalho opcional com filtro de período e menu "…". */
export function Cartao({ titulo, sub, acao, periodo, onPeriodo, menu = false, onMenu, fita = false, children, espacamento = 16 }) {
  const temCab = titulo || acao || periodo || menu;
  return (
    <section style={{ background: 'var(--superficie)', border: '1px solid var(--borda)', borderRadius: 'var(--raio)', padding: espacamento, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {temCab && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, flex: '1 1 160px' }}>
            {titulo && <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--cor-estrutura)' }}>{titulo}</h2>}
            {sub && <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--texto-2)' }}>{sub}</p>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
            {acao}
            {periodo && <Mini onClick={onPeriodo} rotulo="Período">{periodo} <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>▾</span></Mini>}
            {menu && <Mini onClick={onMenu} rotulo="Mais opções"><span style={{ letterSpacing: '0.1em', lineHeight: 1 }}>…</span></Mini>}
          </div>
        </div>
      )}
      {fita && <div aria-hidden="true" style={{ height: 3, background: 'var(--st-transito)', borderRadius: 'var(--raio-pilula)' }} />}
      {children}
    </section>
  );
}
