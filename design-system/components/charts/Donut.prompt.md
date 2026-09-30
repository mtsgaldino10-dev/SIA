Donut com legenda à direita (rótulo, valor, %); use para distribuição por status ou por motivo de divergência.
```jsx
<Donut centro={48} legendaCentro="remessas" fatias={[{rotulo:'Recebida',valor:31,cor:'var(--st-ok)'},{rotulo:'Em trânsito',valor:12,cor:'var(--st-transito)'},{rotulo:'Com divergência',valor:5,cor:'var(--st-alerta)'}]} />
```
- Cores de fatia = cores de status; nunca a legenda só por cor.
