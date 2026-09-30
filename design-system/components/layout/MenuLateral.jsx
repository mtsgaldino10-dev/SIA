import React, { useState } from 'react';
import { Marca } from '../brand/Marca.jsx';
import { BuscaComando } from './BuscaComando.jsx';
function Item({ it, ativo, onNavegar }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={() => onNavegar && onNavegar(it.id)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} aria-current={ativo ? 'page' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--raio)', border: 0, width: '100%', textAlign: 'left', font: '500 1rem var(--fonte)', cursor: 'pointer', color: ativo ? 'var(--menu-texto-ativo)' : 'var(--menu-texto)', background: ativo ? 'var(--menu-ativo)' : h ? 'var(--menu-hover)' : 'transparent', boxShadow: ativo ? '0 0 0 1px var(--borda), var(--sombra-cartao)' : 'none' }}>
      <span style={{ flex: 1 }}>{it.rotulo}</span>
      {it.contagem ? <span style={{ font: '400 0.75rem var(--fonte-mono)', padding: '0 6px', borderRadius: 999, background: it.alerta ? 'var(--st-alerta)' : 'var(--cor-marca)', color: '#fff' }}>{it.contagem}</span> : null}
    </button>
  );
}
/** Menu lateral claro, item ativo em cartão branco, grupos em caixa-alta. */
export function MenuLateral({ grupos, ativo, onNavegar, usuario, busca = true, onBusca, onSair, altura = '100dvh' }) {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', width: 232, flex: 'none', height: altura, position: 'sticky', top: 0, background: 'var(--menu-fundo)', color: 'var(--menu-texto)', padding: '20px 12px', borderRight: '1px solid var(--borda)', overflowY: 'auto' }}>
      <div style={{ padding: '0 10px' }}><Marca cor="var(--cor-estrutura)" /></div>
      {busca && <div style={{ marginTop: 20 }}><BuscaComando placeholder="Buscar" onClick={onBusca} /></div>}
      <nav aria-label="Menu principal" style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: busca ? 8 : 24, flex: 1 }}>
        {grupos.map((g) => (
          <React.Fragment key={g.grupo}>
            <div style={{ margin: '14px 10px 4px', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--menu-grupo)' }}>{g.grupo}</div>
            {g.itens.map((it) => <Item key={it.id} it={it} ativo={it.id === ativo} onNavegar={onNavegar} />)}
          </React.Fragment>
        ))}
      </nav>
      {usuario && (
        <div style={{ borderTop: '1px solid var(--menu-divisor)', padding: '12px 10px 0', fontSize: '0.8rem', color: 'var(--texto-2)' }}>
          <div style={{ color: 'var(--cor-estrutura)', fontWeight: 500 }}>{usuario.nome}</div>
          <div>{usuario.papel}</div>
          <button onClick={onSair} style={{ marginTop: 8, background: 'none', border: '1px solid var(--borda-forte)', color: 'var(--menu-texto)', borderRadius: 'var(--raio)', padding: '6px 10px', font: '500 0.8rem var(--fonte)', cursor: 'pointer' }}>Sair</button>
          <div style={{ marginTop: 12 }}>Gestão de almoxarifado</div>
        </div>
      )}
    </aside>
  );
}
