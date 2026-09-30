const M = window.SIADesignSystem_ad870b;
function InicioBase({ ir }) {
  const { PaginaTopo, Cartao, Etiqueta, ItemLista, Doc, Botao } = M;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PaginaTopo titulo="Olá, Carlos Lima" sub="Gestão de almoxarifado" />
      <h2>Minhas bases</h2>
      <Cartao titulo="Base Contagem" acao={<Botao variante="fantasma" tamanho="peq">Ver saldo</Botao>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <Etiqueta compacta valor={214} legenda="Materiais com saldo" />
          <Etiqueta compacta valor={1} legenda="Remessas a caminho" tom="transito" />
          <Etiqueta compacta valor={2} legenda="Pedidos abertos" tom="info" />
          <Etiqueta compacta valor={0} legenda="Divergências pendentes" tom="ok" />
        </div>
        <ItemLista onClick={() => ir('receber')} titulo={<Doc prefixo="REM" numero={418} />} direita={<span className="sec peq">enviada 29/09/2026</span>} />
      </Cartao>
      <Cartao titulo="Base Betim" acao={<Botao variante="fantasma" tamanho="peq">Ver saldo</Botao>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <Etiqueta compacta valor={187} legenda="Materiais com saldo" />
          <Etiqueta compacta valor={1} legenda="Remessas a caminho" tom="transito" />
          <Etiqueta compacta valor={1} legenda="Pedidos abertos" tom="info" />
          <Etiqueta compacta valor={2} legenda="Divergências pendentes" tom="alerta" />
        </div>
        <ItemLista onClick={() => ir('receber')} titulo={<Doc prefixo="REM" numero={415} />} direita={<span className="sec peq">enviada 26/09/2026</span>} />
      </Cartao>
    </div>
  );
}

function Receber({ ir }) {
  const { PaginaTopo, Aviso, Cartao, Entrada, Campo, Selecao, Botao, Qtd } = M;
  const itens = [{ c: '10004521', d: 'Cabo de cobre nu 16mm²', u: 'M', e: 300 }, { c: '10017388', d: 'Conector cunha estribo', u: 'UN', e: 40 }, { c: '10061204', d: 'Chave fusível 15kV 100A', u: 'PC', e: 9 }, { c: '10022010', d: 'Fita isolante 19mm x 20m', u: 'RL', e: 10 }];
  const [cont, setCont] = React.useState({});
  const [mot, setMot] = React.useState({});
  const [quem, setQuem] = React.useState('');
  const [foto, setFoto] = React.useState(false);
  const [erro, setErro] = React.useState(null);
  const n = (s) => Number(String(s || '').replace(',', '.'));
  function registrar() {
    const f = itens.find((i) => cont[i.c] === undefined || cont[i.c] === '');
    if (f) return setErro(f.c + ' (contado): Informe a quantidade.');
    const m = itens.find((i) => n(cont[i.c]) < i.e && !mot[i.c]);
    if (m) return setErro('Informe o motivo da diferença de ' + m.c + '.');
    if (!quem.trim()) return setErro('Informe o nome de quem contou o material.');
    if (!foto) return setErro('Anexe a foto da guia assinada ou da carga.');
    setErro(null); ir('feito');
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PaginaTopo voltar={{ rotulo: 'Remessa', onClick: () => ir('inicio') }} titulo={<span className="mono" style={{ fontFamily: 'var(--fonte)' }}>Receber REM-000418</span>} sub="Almoxarifado regional → Base Contagem · enviada em 29/09/2026" />
      <Aviso tipo="info">Lance o que foi contado na guia assinada. Item avariado não entra no saldo: conte só o que chegou em condições de uso.</Aviso>
      <Cartao titulo="Contagem">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {itens.map((i) => {
            const menos = cont[i.c] !== undefined && cont[i.c] !== '' && n(cont[i.c]) < i.e;
            return (
              <div key={i.c} style={{ border: '1px solid var(--borda)', borderRadius: 'var(--raio)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, borderLeft: menos ? '6px solid var(--st-alerta)' : '1px solid var(--borda)' }}>
                <div><span className="mono">{i.c}</span><div className="peq">{i.d}</div></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'end' }}>
                  <div><div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Na guia</div><div style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><Qtd valor={i.e} unidade={i.u} /></div></div>
                  <Campo rotulo="Contado"><Entrada num value={cont[i.c] || ''} onChange={(v) => setCont({ ...cont, [i.c]: v })} /></Campo>
                </div>
                {menos && <Campo rotulo="Motivo da diferença"><Selecao value={mot[i.c] || ''} onChange={(v) => setMot({ ...mot, [i.c]: v })} vazio="Escolha…" opcoes={[{ valor: 'falta', rotulo: 'Falta' }, { valor: 'avaria', rotulo: 'Avaria (não entra no saldo)' }, { valor: 'trocado', rotulo: 'Trocado' }]} /></Campo>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Botao variante="fantasma" tamanho="peq" onClick={() => setCont(Object.fromEntries(itens.map((i) => [i.c, cont[i.c] || String(i.e)])))}>Preencher vazios igual à guia</Botao></div>
      </Cartao>
      <Cartao titulo="Conferência">
        <Campo rotulo="Quem contou" ajuda="Nome de quem conferiu o material na chegada (não precisa ter login)."><Entrada value={quem} onChange={setQuem} /></Campo>
        <Campo rotulo="Data da chegada" ajuda="A data real, mesmo que o lançamento seja depois."><Entrada type="date" value="2026-09-29" /></Campo>
        <Campo rotulo="Foto da guia assinada ou da carga" ajuda={foto ? 'guia-REM-000418.jpg' : 'Obrigatória. Pode tirar pelo celular.'}><Botao variante="secundario" onClick={() => setFoto(true)}>{foto ? 'Trocar foto' : 'Tirar foto'}</Botao></Campo>
      </Cartao>
      <Aviso tipo="erro">{erro}</Aviso>
      <div style={{ position: 'sticky', bottom: 8, background: 'var(--cor-fundo)', padding: '8px 0', display: 'flex' }}><Botao largo onClick={registrar}>Registrar recebimento</Botao></div>
    </div>
  );
}

function Feito({ ir }) {
  const { PaginaTopo, Aviso, Doc, StatusBadge, Botao, Cartao, Dados } = M;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PaginaTopo titulo={<><Doc prefixo="REM" numero={418} /><StatusBadge status="recebida" /></>} sub="Almoxarifado regional → Base Contagem" />
      <Aviso tipo="sucesso">Recebimento registrado.</Aviso>
      <Cartao><Dados itens={[['Recebida', '29/09/2026'], ['Conferido por', 'Carlos Lima'], ['Foto', 'guia-REM-000418.jpg']]} /></Cartao>
      <Botao variante="secundario" onClick={() => ir('inicio')}>Voltar ao início</Botao>
    </div>
  );
}
window.InicioBase = InicioBase; window.Receber = Receber; window.Feito = Feito;
