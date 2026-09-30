const K = window.SIADesignSystem_ad870b;
function ImportarMateriais() {
  const { PaginaTopo, Cartao, Campo, Selecao, Botao, StatusBadge, Tabela, Aviso } = K;
  const [etapa, setEtapa] = React.useState(0);
  const cols = ['Material', 'Texto breve material', 'UMB', 'Preço médio', 'Grupo merc.'].map((c, i) => ({ valor: String(i), rotulo: c }));
  const validas = [{ l: 5, c: '10080331', d: 'Cruzeta de concreto 2m', u: 'UN', p: 'R$ 186,40' }, { l: 6, c: '10080340', d: 'Mão francesa plana', u: 'PC', p: 'R$ 22,15' }, { l: 7, c: '10080412', d: 'Arruela quadrada 50mm', u: 'CJ', p: 'R$ 3,90' }];
  const bloq = [{ l: 8, c: '10004521', m: 'Código já cadastrado' }, { l: 11, c: '10090001', m: 'Unidade "CX" não cadastrada' }];
  return (
    <>
      <PaginaTopo trilha={['Cadastros', 'Materiais', 'Importar']} titulo="Importar materiais" sub="Planilha exportada do SAP (XLSX ou CSV). Códigos já cadastrados não são atualizados." />
      <Cartao>
        <Campo rotulo="1. Arquivo" ajuda={etapa ? 'ALMOXARIF 211.xlsx' : 'A linha de cabeçalho é detectada automaticamente.'}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Botao variante="secundario" onClick={() => setEtapa(1)}>Escolher arquivo</Botao><span className="sec peq">{etapa ? 'ALMOXARIF 211.xlsx · 1.284 linhas' : 'Nenhum arquivo escolhido'}</span></div>
        </Campo>
      </Cartao>
      {etapa >= 1 && (
        <Cartao titulo="2. Colunas" sub="Cabeçalho na linha 4. Confira a coluna de cada campo.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[['Código SAP', '0'], ['Descrição', '1'], ['Unidade', '2'], ['Preço (opcional)', '3'], ['Grupo (opcional)', '4']].map(([r, v]) => <Campo key={r} rotulo={r}><Selecao value={v} vazio="— não usar —" opcoes={cols} /></Campo>)}
          </div>
        </Cartao>
      )}
      {etapa >= 1 && etapa < 2 && (
        <Cartao titulo="3. Pré-visualização">
          <div style={{ display: 'flex', gap: 8 }}><StatusBadge tom="ok">1.282 prontos para importar</StatusBadge><StatusBadge tom="alerta">2 bloqueados</StatusBadge></div>
          <Tabela chave="l" linhas={bloq} colunas={[{ chave: 'l', rotulo: 'Linha', mono: true }, { chave: 'c', rotulo: 'Código', mono: true }, { chave: 'm', rotulo: 'Motivo' }]} />
          <Tabela chave="l" linhas={validas} colunas={[{ chave: 'l', rotulo: 'Linha', mono: true }, { chave: 'c', rotulo: 'Código', mono: true }, { chave: 'd', rotulo: 'Descrição' }, { chave: 'u', rotulo: 'Unid.' }, { chave: 'p', rotulo: 'Preço', num: true }]} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Botao onClick={() => setEtapa(2)}>Importar 1.282 materiais</Botao></div>
        </Cartao>
      )}
      {etapa === 2 && (
        <Cartao titulo="Relatório">
          <Aviso tipo="sucesso">1.282 materiais inseridos.</Aviso>
          <Aviso tipo="atencao">2 linhas bloqueadas.</Aviso>
          <Tabela chave="l" linhas={bloq} colunas={[{ chave: 'l', rotulo: 'Linha', mono: true }, { chave: 'c', rotulo: 'Código', mono: true }, { chave: 'm', rotulo: 'Motivo' }]} />
        </Cartao>
      )}
    </>
  );
}

function Login({ entrar }) {
  const { Marca, Campo, Entrada, Botao, Aviso } = K;
  const [u, setU] = React.useState('');
  const [s, setS] = React.useState('');
  const [erro, setErro] = React.useState(null);
  function ok(e) { e.preventDefault(); if (!u || !s) return setErro('Informe usuário e senha.'); entrar(); }
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 16, background: 'var(--cor-estrutura)' }}>
      <form onSubmit={ok} style={{ width: 'min(100%, 380px)', background: 'var(--superficie)', borderTop: '6px solid var(--cor-marca)', borderRadius: 'var(--raio)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Marca comNome cor="var(--cor-estrutura)" />
        <Campo rotulo="Usuário" ajuda="Ex.: matheus.galdino (sem @engelmig.com.br)"><Entrada value={u} onChange={setU} autoComplete="username" /></Campo>
        <Campo rotulo="Senha"><Entrada type="password" value={s} onChange={setS} /></Campo>
        <Aviso tipo="erro">{erro}</Aviso>
        <Botao type="submit">Entrar</Botao>
        <p className="sec peq">Sem acesso? Peça ao administrador do sistema.</p>
      </form>
    </div>
  );
}
window.ImportarMateriais = ImportarMateriais; window.Login = Login;
