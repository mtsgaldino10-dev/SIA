const P = window.SIADesignSystem_ad870b;
function Painel({ ir }) {
  const { PaginaTopo, Etiqueta, Cartao, GraficoLinha, Donut, Tabela, ItemLista, Doc, StatusBadge, Botao } = P;
  const D = window.SIA_DADOS;
  return (
    <>
      <PaginaTopo trilha={['Início', 'Painel geral']} titulo="Painel do 211" sub="Indicadores do período. Remessas paradas mostram a situação de agora." acoes={<Botao variante="secundario" onClick={() => ir('pedidos')}>Ver fila de pedidos</Botao>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        <Etiqueta valor={3} legenda="Pedidos na fila" tom="info" serie={[5, 4, 6, 3, 4, 2, 3]} onClick={() => ir('pedidos')} />
        <Etiqueta valor={7} legenda="Remessas em trânsito" tom="transito" serie={[4, 6, 5, 8, 6, 7, 7]} onClick={() => ir('remessas')} />
        <Etiqueta valor={3} legenda="Divergências abertas" tom="alerta" serie={[1, 1, 2, 2, 4, 3, 3]} onClick={() => ir('divergencias')} />
        <Etiqueta valor="96,4%" legenda="Atendimento no período" tom="ok" serie={[91, 93, 92, 95, 94, 96, 96.4]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16 }}>
        <Cartao titulo="Remessas enviadas × recebidas" sub="Por dia, todas as bases" periodo="Últimos 30 dias" menu>
          <GraficoLinha rotulosX={D.dias} unidade=" rem." series={[{ nome: 'Enviadas', cor: 'var(--cor-marca)', valores: [4, 6, 5, 8, 7, 9, 6, 10, 8, 11] }, { nome: 'Recebidas', cor: 'var(--cor-estrutura)', valores: [3, 5, 5, 6, 7, 8, 6, 8, 8, 9] }]} />
        </Cartao>
        <Cartao titulo="Remessas por status" periodo="Últimos 30 dias" menu>
          <Donut tamanho={150} espessura={20} centro={48} legendaCentro="remessas" fatias={[{ rotulo: 'Recebida', valor: 31, cor: 'var(--st-ok)' }, { rotulo: 'Em trânsito', valor: 7, cor: 'var(--st-transito)' }, { rotulo: 'Com divergência', valor: 5, cor: 'var(--st-alerta)' }, { rotulo: 'Cancelada', valor: 5, cor: 'var(--st-neutro)' }]} />
        </Cartao>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16, alignItems: 'start' }}>
        <Cartao titulo="Fila de pedidos" acao={<Botao variante="fantasma" tamanho="peq" onClick={() => ir('pedidos')}>Ver todos</Botao>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {D.pedidos.filter((p) => p.status === 'solicitado' || p.status === 'aprovado').map((p) => (
              <ItemLista key={p.numero} titulo={<span><Doc prefixo="PED" numero={p.numero} /> · {p.de}</span>} direita={<StatusBadge status={p.status} />} onClick={() => ir('pedido')} />
            ))}
          </div>
        </Cartao>
        <Cartao titulo="Indicadores por almoxarifado" sub="Atendimento = enviado ÷ solicitado. Divergência = remessas com diferença ÷ recebidas." periodo="Últimos 30 dias" menu>
          <Tabela chave="cod" linhas={D.indicadores} colunas={[
            { chave: 'nome', rotulo: 'Almoxarifado', render: (i) => <span><span className="mono">{i.cod}</span> {i.nome}</span> },
            { chave: 'at', rotulo: 'Atendimento', num: true },
            { chave: 'rec', rotulo: 'Recebidas', num: true },
            { chave: 'div', rotulo: 'Divergência', num: true, render: (i) => <span style={i.div !== '0%' ? { color: 'var(--st-alerta-texto)', fontWeight: 600 } : null}>{i.div}</span> },
            { chave: 'tr', rotulo: 'Trânsito (dias)', num: true },
          ]} />
        </Cartao>
      </div>
      <Cartao titulo="Ajustes de inventário" sub="Todo ajuste aparece aqui em destaque, com a justificativa de quem contou." fita>
        <Tabela linhas={[{ id: 1, n: 87, a: 'Base Betim', d: '24/09/2026', j: 'Contagem mensal: 2 rolos de fita a menos', i: 1, v: 'R$ 48,00' }, { id: 2, n: 86, a: 'Almoxarifado regional', d: '20/09/2026', j: 'Inventário rotativo corredor C', i: 3, v: 'R$ 212,40' }]} colunas={[
          { chave: 'n', rotulo: 'Ajuste', render: (a) => <Doc prefixo="AJU" numero={a.n} /> }, { chave: 'a', rotulo: 'Almoxarifado' }, { chave: 'd', rotulo: 'Data' }, { chave: 'j', rotulo: 'Justificativa' }, { chave: 'i', rotulo: 'Itens', num: true }, { chave: 'v', rotulo: 'Valor absoluto', num: true },
        ]} />
      </Cartao>
    </>
  );
}
window.Painel = Painel;
