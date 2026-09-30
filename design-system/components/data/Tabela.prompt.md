Tabela operacional com cabeçalho em caixa-alta e números em mono à direita; use para saldo, indicadores, divergências e prévias de importação.
```jsx
<Tabela colunas={[{chave:'codigo_sap',rotulo:'Código',mono:true},{chave:'descricao',rotulo:'Descrição'},{chave:'saldo',rotulo:'Saldo',num:true,render:l=><Qtd valor={l.saldo}/>}]} linhas={rows} />
```
- No celular, prefira ItemLista.
