import React from 'react';
export function Vazio({ children }) {
  return <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--texto-2)', border: '1px dashed var(--borda-forte)', borderRadius: 'var(--raio)' }}>{children}</div>;
}
