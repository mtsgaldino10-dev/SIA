const PD = window.WareflyDesignSystem_ad870b;
function Pedidos({ ir }) {
  const { PaginaTopo, Abas, ItemLista, Doc, StatusBadge, Botao, Vazio } = PD;
  const D = window.WAREFLY_DADOS;
  const [aba, setAba] = React.useState('fila');
  const lista = D.pedidos.filter((p) => aba === 'fila' ? ['solicitado', 'aprovado'].includes(p.status) : aba === 'abertos' ? !['encerrado', 'cancelado'].includes(p.status) : true);
  return (
    <>
      <PaginaTopo trilha={['Operação', 'Pedidos']} titulo="Pedidos" acoes={<Botao>Novo pedido</Botao>} />
      <Abas abas={[{ id: 'fila', rotulo: 'Fila do 211', contagem: 3 }, { id: 'abertos', rotulo: 'Abertos' }, { id: 'todos', rotulo: 'Todos' }]} ativa={aba} onChange={setAba} />
      {lista.length === 0 ? <Vazio>Nenhum pedido aguardando o 211.</Vazio> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map((p) => (
            <ItemLista key={p.numero} onClick={() => ir('pedido')} titulo={<strong><Doc prefixo="PED" numero={p.numero} /></strong>} direita={<StatusBadge status={p.status} />} sub={p.de + ' → ' + p.para} subDireita={p.itens + ' itens · ' + p.quando} />
          ))}
        </div>
      )}
    </>
  );
}

function PedidoDetalhe({ ir }) {
  const { PaginaTopo, Doc, StatusBadge, Cartao, Dados, Tabela, Entrada, Campo, Aviso, Botao, Qtd } = PD;
  const D = window.WAREFLY_DADOS;
  const [qtds, setQtds] = React.useState(Object.fromEntries(D.itensPedido.map((i) => [i.codigo_sap, String(i.aprovada)])));
  const [doc, setDoc] = React.useState('');
  const [erro, setErro] = React.useState(null);
  const n = (s) => Number(String(s).replace('.', '').replace(',', '.'));
  function enviar() {
    const f = D.itensPedido.find((i) => n(qtds[i.codigo_sap]) > i.saldo);
    if (f) return setErro(f.codigo_sap + ': quantidade acima do saldo do 211.');
    ir('guia');
  }
  return (
    <>
      <PaginaTopo trilha={[{ rotulo: 'Pedidos', onClick: () => ir('pedidos') }, 'PED-001042']} titulo={<><Doc prefixo="PED" numero={1042} /><StatusBadge status="aprovado" /></>} sub="Base Contagem → 211 · Almoxarifado regional" />
      <Cartao><Dados itens={[['Criado', '29/09/2026 08:14 por Carlos Lima'], ['Solicitado', '29/09/2026 08:20'], ['Aprovado', '29/09/2026 10:02 por Ana Souza'], ['Observação', 'Material para a obra da Av. Amazonas']]} /></Cartao>
      <Cartao titulo="Separação e envio" sub="Informe o que foi efetivamente separado. O que não for enviado vira corte.">
        <Tabela chave="codigo_sap" linhas={D.itensPedido} colunas={[
          { chave: 'm', rotulo: 'Material', render: (i) => <span><span className="mono">{i.codigo_sap}</span> · {i.descricao}</span> },
          { chave: 'aprovada', rotulo: 'Aprovada', num: true, render: (i) => <Qtd valor={i.aprovada} unidade={i.unidade} /> },
          { chave: 'saldo', rotulo: 'Saldo', num: true, render: (i) => <span style={n(qtds[i.codigo_sap]) > i.saldo ? { color: 'var(--st-alerta-texto)' } : null}><Qtd valor={i.saldo} /></span> },
          { chave: 'env', rotulo: 'Enviada', largura: 130, render: (i) => <Entrada num value={qtds[i.codigo_sap]} invalido={n(qtds[i.codigo_sap]) > i.saldo} onChange={(v) => setQtds({ ...qtds, [i.codigo_sap]: v })} aria-label={'Enviada de ' + i.codigo_sap} /> },
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo rotulo="Data do envio"><Entrada type="date" value="2026-09-29" /></Campo>
          <Campo rotulo="Documento / guia" ajuda="Opcional: número da guia ou do documento SAP."><Entrada value={doc} onChange={setDoc} /></Campo>
          <Campo rotulo="Observação" style={{ gridColumn: '1 / -1' }}><Entrada /></Campo>
        </div>
        <Aviso tipo="erro">{erro}</Aviso>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Botao variante="perigo">Cancelar pedido</Botao><Botao onClick={enviar}>Registrar envio</Botao></div>
      </Cartao>
    </>
  );
}
window.Pedidos = Pedidos; window.PedidoDetalhe = PedidoDetalhe;
