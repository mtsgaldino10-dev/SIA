const G = window.SIADesignSystem_ad870b;
function Guia({ ir }) {
  const { Marca, Botao } = G;
  const D = window.SIA_DADOS;
  const bd = { border: '1px solid #000', padding: '6px 8px', textAlign: 'left', fontSize: '11pt' };
  const th = { ...bd, fontWeight: 600, background: '#f2f2f2' };
  return (
    <div style={{ background: 'var(--cor-fundo)', minHeight: '100dvh', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 800, margin: '0 auto 16px' }}>
        <button onClick={() => ir('remessas')} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: '0.875rem', color: 'var(--texto-2)', cursor: 'pointer' }}>← Voltar para a remessa</button>
        <span style={{ flex: 1 }} /><Botao onClick={() => window.print()}>Imprimir</Botao>
      </div>
      <article style={{ background: 'white', color: 'black', maxWidth: 800, margin: '0 auto', padding: 24, fontSize: '12pt', boxShadow: '0 1px 0 var(--borda)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div><Marca /><div style={{ fontSize: '9pt' }}>Gestão de almoxarifado</div></div>
          <div style={{ textAlign: 'right' }}><h1 style={{ fontSize: '16pt', color: 'black' }}>Guia de remessa <span className="mono">REM-000418</span></h1><div>Atendimento</div></div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}><tbody>
          <tr><th style={th}>Origem</th><td style={bd}>211 · Almoxarifado regional</td><th style={th}>Destino</th><td style={bd}>B03 · Base Contagem</td></tr>
          <tr><th style={th}>Data do envio</th><td style={bd}>29/09/2026</td><th style={th}>Enviado por</th><td style={bd}>Ana Souza</td></tr>
          <tr><th style={th}>Pedido</th><td style={bd} className="mono">PED-001042</td><th style={th}>Documento</th><td style={bd} className="mono">4900218734</td></tr>
        </tbody></table>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead><tr><th style={th}>Código SAP</th><th style={th}>Descrição</th><th style={th}>Unid.</th><th style={{ ...th, textAlign: 'right' }}>Enviada</th><th style={{ ...th, width: 110 }}>Contagem</th></tr></thead>
          <tbody>
            {D.itensPedido.map((i) => <tr key={i.codigo_sap}><td style={bd} className="mono">{i.codigo_sap}</td><td style={bd}>{i.descricao}</td><td style={bd}>{i.unidade}</td><td style={{ ...bd, textAlign: 'right' }} className="mono">{i.codigo_sap === '10061204' ? 9 : i.aprovada}</td><td style={bd}></td></tr>)}
            {[0, 1, 2].map((k) => <tr key={'v' + k}><td style={{ ...bd, height: 28 }}></td><td style={bd}></td><td style={bd}></td><td style={bd}></td><td style={bd}></td></tr>)}
          </tbody>
        </table>
        <p style={{ fontSize: '9pt', marginTop: 8 }}>Linhas em branco: itens que chegaram sem estar na guia. Anote falta, sobra, avaria ou troca ao lado da contagem.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 48 }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: '10pt' }}>Conferido por (nome e assinatura)</div>
          <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: '10pt' }}>Data da chegada</div>
        </div>
      </article>
    </div>
  );
}
window.Guia = Guia;
