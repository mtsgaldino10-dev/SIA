import React from 'react';
import { Marca } from '../brand/Marca.jsx';
/** Cabeçalho claro fixo do celular. */
export function CabecalhoMovel({ nome }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 16px', background: 'var(--superficie)', color: 'var(--cor-estrutura)', borderBottom: '1px solid var(--borda)' }}>
      <Marca cor="var(--cor-estrutura)" /><span style={{ fontSize: '0.875rem', color: 'var(--texto-2)' }}>{nome}</span>
    </header>
  );
}
/** Barra inferior do celular: até 4 itens principais + "Mais". Item ativo em petróleo. */
export function BarraInferior({ itens, ativo, onNavegar, onMais }) {
  const est = (a) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: a ? 'var(--cor-marca)' : 'var(--texto-2)', font: '500 0.72rem var(--fonte)', background: 'none', border: 0, cursor: 'pointer' });
  return (
    <nav aria-label="Menu rápido" style={{ height: 64, display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', background: 'var(--superficie)', borderTop: '1px solid var(--borda)', flex: 'none' }}>
      {itens.slice(0, 4).map((i) => <button key={i.id} style={est(i.id === ativo)} onClick={() => onNavegar && onNavegar(i.id)}>{i.rotulo}</button>)}
      <button style={est(false)} onClick={onMais}>Mais</button>
    </nav>
  );
}
