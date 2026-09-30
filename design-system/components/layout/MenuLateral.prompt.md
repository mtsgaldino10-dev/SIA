Menu lateral desktop (≥900px): fundo claro, marca com subtítulo, grupos em caixa-alta que abrem e fecham, ícone de traço em cada item, hover azul claro e item ativo preenchido com o azul da marca e texto branco; use como coluna esquerda do app.
```jsx
<MenuLateral grupos={[{grupo:'Operação',itens:[{id:'inicio',rotulo:'Início'},{id:'pedidos',rotulo:'Pedidos',contagem:4}]}]} ativo="inicio" usuario={{nome:'Ana Souza',papel:'Responsável'}} />
```
