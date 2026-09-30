Menu lateral desktop (≥900px): grafite, borda direita cobre 4px, grupos em caixa-alta, item ativo com fundo cobre 22% e filete interno; use como coluna esquerda do app.
```jsx
<MenuLateral grupos={[{grupo:'Operação',itens:[{id:'inicio',rotulo:'Início'},{id:'pedidos',rotulo:'Pedidos',contagem:4}]}]} ativo="inicio" usuario={{nome:'Ana Souza',papel:'Responsável'}} />
```
