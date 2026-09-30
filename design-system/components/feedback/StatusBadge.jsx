import React from 'react';
const ROTULOS = { rascunho: 'Rascunho', solicitado: 'Solicitado', aprovado: 'Aprovado', em_transito: 'Em trânsito', recebido: 'Recebido', recebida: 'Recebida', com_divergencia: 'Com divergência', divergencia: 'Divergência', encerrado: 'Encerrado', encerrada: 'Encerrada', cancelado: 'Cancelado' };
export function tomStatus(s) {
  switch (s) {
    case 'solicitado': case 'aprovado': return 'info';
    case 'em_transito': return 'transito';
    case 'recebido': case 'recebida': case 'encerrado': case 'encerrada': return 'ok';
    case 'com_divergencia': case 'divergencia': return 'alerta';
    default: return 'neutro';
  }
}
const TONS = {
  info: ['--st-info-fundo', '--st-info-texto', '--st-info'],
  transito: ['--st-transito-fundo', '--st-transito-texto', '--st-transito'],
  ok: ['--st-ok-fundo', '--st-ok-texto', '--st-ok'],
  alerta: ['--st-alerta-fundo', '--st-alerta-texto', '--st-alerta'],
  neutro: ['--st-neutro-fundo', '--st-neutro-texto', '--st-neutro'],
};
/** Badge de status: sempre com texto, cor só reforça. */
export function StatusBadge({ status, tom, children }) {
  const t = TONS[tom || tomStatus(status)] || TONS.neutro;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 999, font: '500 0.78rem/1.5 var(--fonte)', whiteSpace: 'nowrap', background: 'var(' + t[0] + ')', color: 'var(' + t[1] + ')' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(' + t[2] + ')', flex: 'none' }} />
      {children || ROTULOS[status] || status}
    </span>
  );
}
