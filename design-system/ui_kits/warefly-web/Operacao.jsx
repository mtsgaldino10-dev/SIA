const O = window.WareflyDesignSystem_ad870b;
function Saldo() {
  const { PaginaTopo, Campo, Selecao, Entrada, Tabela, Qtd, Vazio } = O;
  const D = window.WAREFLY_DADOS;
  const [almox, setAlmox] = React.useState('211');
  const [t, setT] = React.useState('');
  const [zer, setZer] = React.useState(false);
  const q = t.trim().toLowerCase();
  const linhas = D.materiais.map((m) => ({ ...m, saldo: almox === '211' ? m.saldo : Math.round(m.saldo / 7) })).filter((m) => (zer || m.saldo !== 0) && (!q || m.codigo_sap.includes(q) || m.descricao.toLowerCase().includes(q)));
  return (
    <>
      <PaginaTopo trilha={['Operação', 'Saldo']} titulo="Saldo" sub="Saldo é sempre a soma das movimentações. Nunca é editado." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Campo rotulo="Almoxarifado"><Selecao value={almox} onChange={setAlmox} opcoes={D.bases.map((b) => ({ valor: b.id, rotulo: b.codigo + ' · ' + b.nome }))} /></Campo>
        <Campo rotulo="Buscar"><Entrada type="search" placeholder="Código SAP ou descrição" value={t} onChange={setT} /></Campo>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.875rem' }}><input type="checkbox" checked={zer} onChange={(e) => setZer(e.target.checked)} style={{ accentColor: 'var(--cor-marca)' }} />Mostrar materiais zerados</label>
      {linhas.length === 0 ? <Vazio>Nenhum material com saldo aqui.</Vazio> : (
        <Tabela chave="codigo_sap" linhas={linhas} colunas={[{ chave: 'codigo_sap', rotulo: 'Código', mono: true }, { chave: 'descricao', rotulo: 'Descrição' }, { chave: 'saldo', rotulo: 'Saldo', num: true, render: (l) => <Qtd valor={l.saldo} /> }, { chave: 'unidade', rotulo: 'Unid.' }, { chave: 'ult', rotulo: 'Última mov.', render: (l) => <span className="sec peq">{l.ult}</span> }]} />
      )}
      <p className="sec peq">{linhas.length} materiais</p>
    </>
  );
}

function Remessas({ ir }) {
  const { PaginaTopo, ItemLista, Doc, StatusBadge, Botao } = O;
  const r = [{ n: 418, s: 'em_transito', rota: '211 → Base Contagem', q: 'enviada 29/09/2026' }, { n: 415, s: 'em_transito', rota: '211 → Base Betim', q: 'enviada 26/09/2026' }, { n: 412, s: 'com_divergencia', rota: '211 → Base Betim', q: 'recebida 24/09/2026' }, { n: 410, s: 'encerrada', rota: '211 → Base Sete Lagoas', q: 'recebida 23/09/2026' }];
  return (
    <>
      <PaginaTopo trilha={['Operação', 'Remessas']} titulo="Remessas" sub="Toda remessa viaja com a guia impressa." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {r.map((x) => <ItemLista key={x.n} onClick={() => ir('guia')} titulo={<strong><Doc prefixo="REM" numero={x.n} /></strong>} direita={<StatusBadge status={x.s} />} sub={x.rota} subDireita={x.q} />)}
      </div>
      <div><Botao variante="secundario" onClick={() => ir('guia')}>Imprimir guia REM-000418</Botao></div>
    </>
  );
}

function Divergencias() {
  const { PaginaTopo, Tabela, Doc, Botao, Cartao, Campo, Selecao, Entrada, Aviso, Qtd } = O;
  const D = window.WAREFLY_DADOS;
  const [lista, setLista] = React.useState(D.divergencias);
  const [aberta, setAberta] = React.useState(null);
  const [just, setJust] = React.useState('');
  const [erro, setErro] = React.useState(null);
  const [ok, setOk] = React.useState(null);
  const d = lista.find((x) => x.id === aberta);
  function registrar() {
    if (!just.trim()) return setErro('Informe a justificativa do tratamento.');
    setLista(lista.filter((x) => x.id !== aberta)); setAberta(null); setJust(''); setErro(null); setOk('Tratamento registrado.');
  }
  return (
    <>
      <PaginaTopo trilha={['Operação', 'Divergências']} titulo="Divergências" sub="Divergência não some sozinha: fica aberta até ser tratada com justificativa." />
      <Aviso tipo="sucesso">{ok}</Aviso>
      <Tabela linhas={lista} colunas={[
        { chave: 'rem', rotulo: 'Remessa', render: (x) => <div><a href="#" className="mono"><Doc prefixo="REM" numero={x.rem} /></a><div className="sec peq">{x.tipo}</div></div> },
        { chave: 'rota', rotulo: 'Origem → destino' },
        { chave: 'm', rotulo: 'Material', render: (x) => <div><span className="mono">{x.codigo_sap}</span><div className="peq">{x.descricao}</div></div> },
        { chave: 'motivo', rotulo: 'Motivo' },
        { chave: 'dif', rotulo: 'Diferença', num: true, render: (x) => <span>{x.dif > 0 ? 'faltou ' : 'sobrou '}<Qtd valor={Math.abs(x.dif)} unidade={x.un} /></span> },
        { chave: 'aberto', rotulo: 'Em aberto', num: true },
        { chave: 'dias', rotulo: 'Dias', num: true },
        { chave: 'a', rotulo: '', render: (x) => <Botao variante="secundario" tamanho="peq" onClick={() => { setOk(null); setAberta(aberta === x.id ? null : x.id); }}>Tratar</Botao> },
      ]} />
      {d && (
        <Cartao titulo={'Tratar REM-' + String(d.rem).padStart(6, '0') + ' · ' + d.codigo_sap}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Campo rotulo="Tratamento" ajuda="A origem manda de novo. Gera uma nova remessa, com nova conferência."><Selecao value="reenvio" opcoes={[{ valor: 'reenvio', rotulo: 'Reenvio' }, { valor: 'baixa_transito', rotulo: 'Baixa em trânsito' }, { valor: 'estorno_origem', rotulo: 'Não saiu da origem' }]} /></Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Campo rotulo="Quantidade" ajuda={'Em aberto: ' + d.aberto + ' ' + d.un}><Entrada num value={String(d.aberto)} /></Campo>
              <Campo rotulo="Data"><Entrada type="date" value="2026-09-29" /></Campo>
            </div>
            <Campo rotulo="Justificativa" style={{ gridColumn: '1 / -1' }}><Entrada value={just} onChange={setJust} /></Campo>
          </div>
          <Aviso tipo="erro">{erro}</Aviso>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Botao onClick={registrar}>Registrar tratamento</Botao></div>
        </Cartao>
      )}
    </>
  );
}
window.Saldo = Saldo; window.Remessas = Remessas; window.Divergencias = Divergencias;
