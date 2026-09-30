import React from 'react';
const T = { erro: 'alerta', sucesso: 'ok', info: 'info', atencao: 'transito' };
export function Aviso({ tipo = 'info', children }) {
  if (!children) return null;
  const k = T[tipo];
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} style={{ borderRadius: 'var(--raio)', padding: '10px 12px', border: '1px solid color-mix(in srgb, var(--st-' + k + ') 40%, transparent)', fontSize: '0.95rem', background: 'var(--st-' + k + '-fundo)', color: 'var(--st-' + k + '-texto)' }}>
      {children}
    </div>
  );
}
