import React, { useState } from 'react';
export const estiloControle = { font: '400 1rem var(--fonte)', color: 'var(--texto)', background: 'var(--superficie)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio)', padding: '9px 10px', minHeight: 42, width: '100%' };
/** Campo de texto. num = mono à direita (quantidades). */
export function Entrada({ value, onChange, num = false, invalido = false, type = 'text', placeholder, multilinha = false, ...resto }) {
  const [f, setF] = useState(false);
  const Tag = multilinha ? 'textarea' : 'input';
  return (
    <Tag type={multilinha ? undefined : type} value={value} placeholder={placeholder} inputMode={num ? 'decimal' : undefined}
      onChange={(e) => onChange && onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={Object.assign({}, estiloControle, num ? { fontFamily: 'var(--fonte-mono)', textAlign: 'right' } : null, multilinha ? { minHeight: 72, resize: 'vertical' } : null, invalido ? { borderColor: 'var(--st-alerta)' } : null, f ? { outline: '2px solid var(--cor-marca)', outlineOffset: 1 } : { outline: 'none' })}
      aria-invalid={invalido || undefined} {...resto} />
  );
}
