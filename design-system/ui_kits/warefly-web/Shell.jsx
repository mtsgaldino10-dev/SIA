const S = window.WareflyDesignSystem_ad870b;
function Shell({ ativo, onNavegar, children }) {
  const { MenuLateral } = S;
  const grupos = [
    { grupo: 'Operação', itens: [{ id: 'inicio', rotulo: 'Início' }, { id: 'saldo', rotulo: 'Saldo' }, { id: 'pedidos', rotulo: 'Pedidos', contagem: 3 }, { id: 'remessas', rotulo: 'Remessas' }, { id: 'divergencias', rotulo: 'Divergências', contagem: 3, alerta: true }, { id: 'historico', rotulo: 'Histórico' }] },
    { grupo: 'Gestão', itens: [{ id: 'painel', rotulo: 'Painel da gestão' }] },
    { grupo: 'Cadastros', itens: [{ id: 'materiais', rotulo: 'Materiais' }, { id: 'usuarios', rotulo: 'Usuários e atribuições' }, { id: 'saldo-inicial', rotulo: 'Saldo inicial' }] },
  ];
  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <MenuLateral grupos={grupos} ativo={ativo} onNavegar={onNavegar} usuario={{ nome: 'Ana Souza', papel: 'Responsável · 211' }} onSair={() => onNavegar('login')} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: '28px 32px 48px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
      </main>
    </div>
  );
}
window.Shell = Shell;
